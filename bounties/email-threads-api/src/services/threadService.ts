import prisma from '../config/database';
import { Thread, Prisma } from '@prisma/client';
import {
  ThreadQueryFilters,
  ThreadResponse,
  PaginatedResponse,
} from '../types';

export class ThreadService {
  /**
   * List threads for a user with filtering, search, and pagination
   */
  async listThreads(
    userId: string,
    filters: ThreadQueryFilters
  ): Promise<PaginatedResponse<ThreadResponse>> {
    const {
      search,
      isRead,
      isStarred,
      isArchived = false,
      hasDrafts,
      label,
      participantEmail,
      dateFrom,
      dateTo,
      sortBy = 'lastMessageAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.ThreadWhereInput = {
      userId,
      isArchived,
      isDeleted: false,
    };

    // Search filter
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { snippet: { contains: search, mode: 'insensitive' } },
        { participantIds: { hasSome: [search] } },
      ];
    }

    // Boolean filters
    if (isRead !== undefined) where.isRead = isRead;
    if (isStarred !== undefined) where.isStarred = isStarred;
    if (hasDrafts) where.draftCount = { gt: 0 };

    // Label filter
    if (label) {
      where.labels = { has: label };
    }

    // Participant filter
    if (participantEmail) {
      where.participantIds = { has: participantEmail };
    }

    // Date range filters
    if (dateFrom || dateTo) {
      where.lastMessageAt = {};
      if (dateFrom) where.lastMessageAt.gte = new Date(dateFrom);
      if (dateTo) where.lastMessageAt.lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              messages: true,
              drafts: { where: { isDeleted: false } },
            },
          },
        },
      }),
      prisma.thread.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: threads.map(this.formatThreadResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get a single thread with all messages and drafts
   */
  async getThread(
    threadId: string,
    userId: string
  ): Promise<ThreadResponse | null> {
    const thread = await prisma.thread.findFirst({
      where: {
        id: threadId,
        userId,
        isDeleted: false,
      },
      include: {
        messages: {
          where: {
            // Exclude archived/deleted messages from thread view
          },
          orderBy: { sentAt: 'asc' },
        },
        drafts: {
          where: { isDeleted: false },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!thread) return null;

    // Mark thread as read
    if (!thread.isRead) {
      await prisma.thread.update({
        where: { id: threadId },
        data: { isRead: true },
      });
    }

    // Mark all unread messages as read
    await prisma.message.updateMany({
      where: {
        threadId,
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return {
      id: thread.id,
      subject: thread.subject,
      snippet: thread.snippet,
      participants: thread.participantIds,
      messageCount: thread.messages.length,
      draftCount: thread.drafts.length,
      isRead: true,
      isStarred: thread.isStarred,
      isArchived: thread.isArchived,
      labels: thread.labels,
      lastMessageAt: thread.lastMessageAt,
      lastDraftAt: thread.lastDraftAt,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      messages: thread.messages.map((msg) => ({
        id: msg.id,
        from: msg.from,
        to: msg.to,
        cc: msg.cc,
        bcc: msg.bcc,
        subject: msg.subject,
        body: msg.body,
        bodyPreview: msg.bodyPreview,
        isRead: msg.isRead,
        isStarred: msg.isStarred,
        hasAttachments: msg.hasAttachments,
        attachments: msg.attachments as any,
        provider: msg.provider,
        sentAt: msg.sentAt,
        receivedAt: msg.receivedAt,
      })),
      drafts: thread.drafts.map((draft) => ({
        id: draft.id,
        from: draft.from,
        to: draft.to,
        cc: draft.cc,
        bcc: draft.bcc,
        subject: draft.subject,
        body: draft.body,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
      })),
    };
  }

  /**
   * Search threads grouped by thread (consistent with message search)
   */
  async searchThreads(
    userId: string,
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<ThreadResponse>> {
    return this.listThreads(userId, {
      search: query,
      page,
      limit,
      isArchived: false,
    });
  }

  /**
   * Update thread properties (star, archive, labels)
   */
  async updateThread(
    threadId: string,
    userId: string,
    data: {
      isStarred?: boolean;
      isArchived?: boolean;
      labels?: string[];
    }
  ): Promise<ThreadResponse | null> {
    const thread = await prisma.thread.findFirst({
      where: { id: threadId, userId, isDeleted: false },
    });

    if (!thread) return null;

    const updated = await prisma.thread.update({
      where: { id: threadId },
      data,
    });

    return this.formatThreadResponse(updated);
  }

  /**
   * Soft delete a thread
   */
  async deleteThread(threadId: string, userId: string): Promise<boolean> {
    const thread = await prisma.thread.findFirst({
      where: { id: threadId, userId, isDeleted: false },
    });

    if (!thread) return false;

    await prisma.thread.update({
      where: { id: threadId },
      data: { isDeleted: true },
    });

    return true;
  }

  /**
   * Update thread recency when a draft is created/updated/sent
   */
  async updateThreadRecency(
    threadId: string,
    action: 'draft_created' | 'draft_updated' | 'draft_sent'
  ): Promise<void> {
    const updateData: Prisma.ThreadUpdateInput = {};

    switch (action) {
      case 'draft_created':
      case 'draft_updated':
        updateData.lastDraftAt = new Date();
        updateData.draftCount = { increment: action === 'draft_created' ? 1 : 0 };
        break;
      case 'draft_sent':
        updateData.lastMessageAt = new Date();
        updateData.lastDraftAt = null;
        updateData.draftCount = { decrement: 1 };
        updateData.messageCount = { increment: 1 };
        break;
    }

    await prisma.thread.update({
      where: { id: threadId },
      data: updateData,
    });
  }

  /**
   * Create or find thread for a synced email (Gmail, Outlook, IMAP)
   */
  async syncEmailToThread(
    userId: string,
    emailData: {
      subject: string;
      from: string;
      to: string[];
      cc?: string[];
      body: string;
      bodyPreview?: string;
      sentAt: Date;
      provider: string;
      emailAccountId: string;
      externalId?: string;
      hasAttachments?: boolean;
      attachments?: any;
    }
  ): Promise<string> {
    // Normalize subject for thread matching (remove Re:/Fwd: prefixes)
    const normalizedSubject = this.normalizeSubject(emailData.subject);

    // Try to find existing thread by subject and participants
    const participants = [
      emailData.from,
      ...emailData.to,
      ...(emailData.cc || []),
    ];

    let thread = await prisma.thread.findFirst({
      where: {
        userId,
        subject: { contains: normalizedSubject, mode: 'insensitive' },
        participantIds: { hasEvery: participants },
        isDeleted: false,
      },
    });

    if (!thread) {
      // Create new thread
      thread = await prisma.thread.create({
        data: {
          userId,
          subject: emailData.subject,
          snippet: emailData.bodyPreview?.substring(0, 200),
          participantIds: [...new Set(participants)],
          messageCount: 1,
          lastMessageAt: emailData.sentAt,
        },
      });
    } else {
      // Update existing thread
      await prisma.thread.update({
        where: { id: thread.id },
        data: {
          lastMessageAt: emailData.sentAt,
          messageCount: { increment: 1 },
          snippet: emailData.bodyPreview?.substring(0, 200) || thread.snippet,
          participantIds: [...new Set([...thread.participantIds, ...participants])],
          isRead: false,
        },
      });
    }

    // Create message
    await prisma.message.create({
      data: {
        threadId: thread.id,
        userId,
        emailAccountId: emailData.emailAccountId,
        externalId: emailData.externalId,
        from: emailData.from,
        to: emailData.to,
        cc: emailData.cc || [],
        subject: emailData.subject,
        body: emailData.body,
        bodyPreview: emailData.bodyPreview,
        hasAttachments: emailData.hasAttachments || false,
        attachments: emailData.attachments,
        provider: emailData.provider as any,
        sentAt: emailData.sentAt,
      },
    });

    return thread.id;
  }

  private normalizeSubject(subject: string): string {
    return subject
      .replace(/^(Re|Fwd|Fw|Forward):\s*/gi, '')
      .trim();
  }

  private formatThreadResponse(thread: any): ThreadResponse {
    return {
      id: thread.id,
      subject: thread.subject,
      snippet: thread.snippet,
      participants: thread.participantIds,
      messageCount: thread.messageCount || thread._count?.messages || 0,
      draftCount: thread.draftCount || thread._count?.drafts || 0,
      isRead: thread.isRead,
      isStarred: thread.isStarred,
      isArchived: thread.isArchived,
      labels: thread.labels,
      lastMessageAt: thread.lastMessageAt,
      lastDraftAt: thread.lastDraftAt,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    };
  }
}

export const threadService = new ThreadService();
