import { PrismaClient, Prisma } from '@prisma/client';
import {
  AuthContext,
  ListThreadsQuery,
  CreateDraftBody,
  ThreadResponse,
  ThreadSummary,
  MessageResponse,
  MessageSummary,
  ProviderMessage,
} from '../types';

const prisma = new PrismaClient();

export class ThreadsService {
  /**
   * List threads for the authenticated user.
   * Supports search across subject/body/participants,
   * folder filtering (inbox/drafts/archived/deleted/all),
   * and pagination.
   */
  async listThreads(
    auth: AuthContext,
    query: ListThreadsQuery
  ): Promise<{ threads: ThreadSummary[]; total: number; page: number; limit: number }> {
    const { search, folder, page, limit } = query;

    // Build where clause based on folder
    const where: Prisma.ThreadWhereInput = {
      ownerId: auth.userId,
    };

    // Folder-based filtering
    switch (folder) {
      case 'inbox':
        where.isArchived = false;
        where.isDeleted = false;
        where.messages = {
          some: { isDraft: false, isArchived: false, isDeleted: false },
        };
        break;
      case 'drafts':
        where.isDeleted = false;
        where.messages = {
          some: { isDraft: true, isDeleted: false },
        };
        break;
      case 'archived':
        where.isArchived = true;
        where.isDeleted = false;
        break;
      case 'deleted':
        where.isDeleted = true;
        break;
      case 'all':
        // No folder filters — show everything
        break;
    }

    // Search across subject and message body
    if (search) {
      where.AND = [
        {
          OR: [
            { subject: { contains: search } },
            { messages: { some: { body: { contains: search } } } },
          ],
        },
      ];
    }

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where,
        orderBy: { lastActivity: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          messages: {
            where: {
              isDeleted: false,
              ...(folder !== 'all' && folder !== 'drafts' ? { isArchived: false } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              messages: {
                where: {
                  isDeleted: false,
                  ...(folder !== 'all' && folder !== 'drafts' ? { isArchived: false } : {}),
                },
              },
            },
          },
        },
      }),
      prisma.thread.count({ where }),
    ]);

    return {
      threads: threads.map((t) => ({
        id: t.id,
        subject: t.subject,
        lastActivity: t.lastActivity.toISOString(),
        isArchived: t.isArchived,
        isDeleted: t.isDeleted,
        messageCount: t._count.messages,
        latestMessage: t.messages[0]
          ? {
              id: t.messages[0].id,
              body: t.messages[0].body.slice(0, 200),
              senderId: t.messages[0].senderId,
              isDraft: t.messages[0].isDraft,
              createdAt: t.messages[0].createdAt.toISOString(),
            }
          : undefined,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single thread with all its messages.
   */
  async getThread(auth: AuthContext, threadId: string): Promise<ThreadResponse> {
    const thread = await prisma.thread.findFirst({
      where: {
        id: threadId,
        ownerId: auth.userId,
      },
      include: {
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    return {
      id: thread.id,
      subject: thread.subject,
      lastActivity: thread.lastActivity.toISOString(),
      isArchived: thread.isArchived,
      isDeleted: thread.isDeleted,
      messageCount: thread.messages.length,
      messages: thread.messages.map(this.formatMessage),
    };
  }

  /**
   * Create a draft in an existing thread and update its recency.
   */
  async createDraft(auth: AuthContext, threadId: string, body: CreateDraftBody): Promise<MessageResponse> {
    const thread = await prisma.thread.findFirst({
      where: { id: threadId, ownerId: auth.userId },
    });

    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: auth.userId,
        body: body.body,
        subject: body.subject || '',
        isDraft: true,
      },
    });

    // Update thread recency — this is what keeps thread ordering correct
    await prisma.thread.update({
      where: { id: threadId },
      data: { lastActivity: new Date() },
    });

    return this.formatMessage(message);
  }

  /**
   * Send a draft (convert draft to sent message) and update recency.
   */
  async sendDraft(auth: AuthContext, threadId: string, draftId: string): Promise<MessageResponse> {
    const thread = await prisma.thread.findFirst({
      where: { id: threadId, ownerId: auth.userId },
    });

    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    const draft = await prisma.message.findFirst({
      where: {
        id: draftId,
        threadId,
        senderId: auth.userId,
        isDraft: true,
      },
    });

    if (!draft) {
      throw new NotFoundError('Draft not found');
    }

    const sent = await prisma.message.update({
      where: { id: draftId },
      data: {
        isDraft: false,
        updatedAt: new Date(),
      },
    });

    // Update recency on send
    await prisma.thread.update({
      where: { id: threadId },
      data: { lastActivity: new Date() },
    });

    return this.formatMessage(sent);
  }

  /**
   * Import a provider message (Gmail/Outlook/IMAP) and thread it correctly.
   * Handles out-of-order delivery by updating thread recency to the provider's timestamp.
   */
  async importProviderMessage(auth: AuthContext, providerMsg: ProviderMessage): Promise<MessageResponse> {
    // Find or create thread by subject/references
    let thread = await this.findOrCreateThread(auth, providerMsg);

    // Dedup by providerId
    const existing = await prisma.message.findFirst({
      where: { providerId: providerMsg.providerId },
    });

    if (existing) {
      return this.formatMessage(existing);
    }

    const receivedAt = new Date(providerMsg.receivedAt);

    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: auth.userId,
        body: providerMsg.body,
        subject: providerMsg.subject,
        isDraft: false,
        providerId: providerMsg.providerId,
        createdAt: receivedAt,
      },
    });

    // Thread recency uses the provider's timestamp, not server time
    // This prevents out-of-order or late-arriving messages from breaking ordering
    if (receivedAt > thread.lastActivity) {
      await prisma.thread.update({
        where: { id: thread.id },
        data: { lastActivity: receivedAt },
      });
    }

    return this.formatMessage(message);
  }

  /**
   * Find or create a thread for a provider message.
   * Uses provider threadId, in-reply-to, or subject matching.
   */
  private async findOrCreateThread(auth: AuthContext, providerMsg: ProviderMessage) {
    // Strategy 1: Match by provider thread/conversation ID
    if (providerMsg.threadId) {
      const existing = await prisma.thread.findFirst({
        where: {
          ownerId: auth.userId,
          messages: {
            some: { providerId: { contains: providerMsg.threadId } },
          },
        },
      });
      if (existing) return existing;
    }

    // Strategy 2: Match by subject (normalized)
    if (providerMsg.subject) {
      const normalizedSubject = providerMsg.subject.replace(/^(Re:|Fwd:)\s*/i, '').trim();
      const existing = await prisma.thread.findFirst({
        where: {
          ownerId: auth.userId,
          subject: { contains: normalizedSubject },
          messages: {
            some: { isDraft: false },
          },
        },
      });
      if (existing) return existing;
    }

    // Strategy 3: Create new thread
    return prisma.thread.create({
      data: {
        subject: providerMsg.subject || '(no subject)',
        ownerId: auth.userId,
      },
    });
  }

  private formatMessage(m: any): MessageResponse {
    return {
      id: m.id,
      threadId: m.threadId,
      senderId: m.senderId,
      body: m.body,
      subject: m.subject || '',
      isDraft: m.isDraft,
      isArchived: m.isArchived,
      isDeleted: m.isDeleted,
      isRead: m.isRead,
      providerId: m.providerId,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    };
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export const threadsService = new ThreadsService();
