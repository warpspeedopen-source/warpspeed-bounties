import { PrismaClient, MessageStatus, EmailProvider } from '@prisma/client';
import {
  ThreadListItem,
  ThreadDetail,
  MessageDetail,
  ThreadListQuery,
  CreateDraftInput,
  UpdateDraftInput,
  SendDraftInput,
} from '../types/email';

const prisma = new PrismaClient();

export class EmailThreadService {
  /**
   * List email threads for the authenticated user.
   * Supports pagination, search, filtering, and sorting.
   */
  async listThreads(userId: string, query: ThreadListQuery): Promise<{
    threads: ThreadListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where = this.buildThreadWhereClause(userId, query);

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where,
        orderBy: this.buildThreadOrderBy(query),
        skip,
        take: pageSize,
        include: {
          messages: {
            where: {
              status: { notIn: [MessageStatus.DELETED] },
            },
            orderBy: { sentAt: 'asc' },
            take: 1,
            skip: 0,
          },
        },
      }),
      prisma.thread.count({ where }),
    ]);

    // Determine if each thread has a draft
    const threadIds = threads.map((t) => t.id);
    const draftCounts = await prisma.message.groupBy({
      by: ['threadId'],
      where: {
        threadId: { in: threadIds },
        status: MessageStatus.DRAFT,
        userId,
      },
      _count: { threadId: true },
    });
    const draftThreadIds = new Set(draftCounts.map((d) => d.threadId));

    const result: ThreadListItem[] = threads.map((t) => ({
      id: t.id,
      subject: t.subject,
      snippet: t.snippet,
      participants: t.participants,
      messageCount: t.messageCount,
      unreadCount: t.unreadCount,
      lastMessageAt: t.lastMessageAt,
      hasDraft: draftThreadIds.has(t.id),
    }));

    return {
      threads: result,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get a single thread with its messages.
   */
  async getThread(
    userId: string,
    threadId: string,
    options: { includeMessages?: boolean; messageLimit?: number } = {}
  ): Promise<ThreadDetail> {
    const thread = await prisma.thread.findFirst({
      where: { id: threadId, userId },
      include: {
        messages: {
          where: {
            status: { notIn: [MessageStatus.DELETED] },
          },
          orderBy: { sentAt: 'asc' },
          take: options.messageLimit ?? 50,
        },
      },
    });

    if (!thread) {
      throw new Error('Thread not found');
    }

    const messages: MessageDetail[] = thread.messages.map((m) => ({
      id: m.id,
      messageId: m.messageId,
      from: m.from,
      to: m.to,
      cc: m.cc,
      bcc: m.bcc,
      subject: m.subject,
      body: m.body,
      bodyHtml: m.bodyHtml,
      status: m.status,
      provider: m.provider,
      sentAt: m.sentAt,
      receivedAt: m.receivedAt,
      createdAt: m.createdAt,
    }));

    return {
      id: thread.id,
      subject: thread.subject,
      participants: thread.participants,
      messageCount: thread.messageCount,
      unreadCount: thread.unreadCount,
      lastMessageAt: thread.lastMessageAt,
      createdAt: thread.createdAt,
      messages: options.includeMessages === false ? [] : messages,
    };
  }

  /**
   * Create a draft message, optionally within an existing thread.
   * If threadId is provided, the draft is added to that thread.
   * Otherwise, a new thread is created.
   */
  async createDraft(userId: string, input: CreateDraftInput): Promise<{
    threadId: string;
    messageId: string;
  }> {
    let threadId: string;

    if (input.threadId) {
      // Verify the thread belongs to the user
      const thread = await prisma.thread.findFirst({
        where: { id: input.threadId, userId },
      });
      if (!thread) {
        throw new Error('Thread not found');
      }
      threadId = thread.id;
    } else {
      // Create a new thread
      const thread = await prisma.thread.create({
        data: {
          userId,
          subject: input.subject,
          snippet: input.body.substring(0, 200),
          participants: this.extractParticipants(input.to, input.cc, input.bcc),
          messageCount: 1,
          unreadCount: 0,
          lastMessageAt: new Date(),
        },
      });
      threadId = thread.id;
    }

    const messageId = this.generateMessageId();

    const message = await prisma.message.create({
      data: {
        threadId,
        userId,
        messageId,
        inReplyTo: input.inReplyTo,
        references: input.references ?? [],
        from: userId,
        to: input.to,
        cc: input.cc ?? [],
        bcc: input.bcc ?? [],
        subject: input.subject,
        body: input.body,
        bodyHtml: input.bodyHtml,
        status: MessageStatus.DRAFT,
        provider: EmailProvider.GMAIL, // Default; will be set on send
        sentAt: null,
        receivedAt: null,
      },
    });

    // Update thread recency
    await this.updateThreadRecency(threadId, new Date());

    return { threadId, messageId: message.id };
  }

  /**
   * Update an existing draft message.
   */
  async updateDraft(
    userId: string,
    messageId: string,
    input: UpdateDraftInput
  ): Promise<{ threadId: string; messageId: string }> {
    const message = await prisma.message.findFirst({
      where: { id: messageId, userId, status: MessageStatus.DRAFT },
    });

    if (!message) {
      throw new Error('Draft not found');
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        ...(input.to !== undefined && { to: input.to }),
        ...(input.cc !== undefined && { cc: input.cc }),
        ...(input.bcc !== undefined && { bcc: input.bcc }),
        ...(input.subject !== undefined && { subject: input.subject }),
        ...(input.body !== undefined && { body: input.body }),
        ...(input.bodyHtml !== undefined && { bodyHtml: input.bodyHtml }),
      },
    });

    // Update thread recency
    await this.updateThreadRecency(message.threadId, new Date());

    return { threadId: message.threadId, messageId: message.id };
  }

  /**
   * Send a draft message.
   */
  async sendDraft(
    userId: string,
    messageId: string,
    input: SendDraftInput
  ): Promise<{ threadId: string; messageId: string; sentAt: Date }> {
    const message = await prisma.message.findFirst({
      where: { id: messageId, userId, status: MessageStatus.DRAFT },
    });

    if (!message) {
      throw new Error('Draft not found');
    }

    const sentAt = new Date();

    await prisma.message.update({
      where: { id: messageId },
      data: {
        to: input.to,
        cc: input.cc ?? [],
        bcc: input.bcc ?? [],
        subject: input.subject,
        body: input.body,
        bodyHtml: input.bodyHtml,
        status: MessageStatus.SENT,
        sentAt,
      },
    });

    // Update thread recency
    await this.updateThreadRecency(message.threadId, sentAt);

    return { threadId: message.threadId, messageId: message.id, sentAt };
  }

  /**
   * Archive a message within a thread.
   */
  async archiveMessage(userId: string, messageId: string): Promise<void> {
    const message = await prisma.message.findFirst({
      where: { id: messageId, userId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { status: MessageStatus.ARCHIVED },
    });
  }

  /**
   * Delete a message within a thread.
   */
  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await prisma.message.findFirst({
      where: { id: messageId, userId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { status: MessageStatus.DELETED },
    });

    // Update thread message count
    const remaining = await prisma.message.count({
      where: {
        threadId: message.threadId,
        status: { not: MessageStatus.DELETED },
      },
    });

    await prisma.thread.update({
      where: { id: message.threadId },
      data: { messageCount: remaining },
    });
  }

  /**
   * Search threads with consistent behavior to the messages endpoint.
   */
  async searchThreads(
    userId: string,
    searchQuery: string,
    options: {
      page?: number;
      pageSize?: number;
      status?: MessageStatus | 'all';
      provider?: EmailProvider | 'all';
    } = {}
  ): Promise<{
    threads: ThreadListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where = this.buildSearchWhereClause(userId, searchQuery, options);

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.thread.count({ where }),
    ]);

    const threadIds = threads.map((t) => t.id);
    const draftCounts = await prisma.message.groupBy({
      by: ['threadId'],
      where: {
        threadId: { in: threadIds },
        status: MessageStatus.DRAFT,
        userId,
      },
      _count: { threadId: true },
    });
    const draftThreadIds = new Set(draftCounts.map((d) => d.threadId));

    const result: ThreadListItem[] = threads.map((t) => ({
      id: t.id,
      subject: t.subject,
      snippet: t.snippet,
      participants: t.participants,
      messageCount: t.messageCount,
      unreadCount: t.unreadCount,
      lastMessageAt: t.lastMessageAt,
      hasDraft: draftThreadIds.has(t.id),
    }));

    return {
      threads: result,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // ─── Private helpers ───────────────────────────────────────────────

  private buildThreadWhereClause(
    userId: string,
    query: ThreadListQuery
  ): PrismaClient['thread']['$extends'] extends never
    ? Record<string, unknown>
    : Record<string, unknown> {
    const where: Record<string, unknown> = { userId };

    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { snippet: { contains: query.search, mode: 'insensitive' } },
        { participants: { has: query.search } },
      ];
    }

    if (query.status && query.status !== 'all') {
      where.messages = {
        some: { status: query.status, status: { not: MessageStatus.DELETED } },
      };
    }

    if (query.provider && query.provider !== 'all') {
      where.messages = {
        ...(where.messages as object),
        some: { provider: query.provider },
      };
    }

    if (query.unreadOnly) {
      where.unreadCount = { gt: 0 };
    }

    if (query.hasDraft) {
      where.messages = {
        ...(where.messages as object),
        some: { status: MessageStatus.DRAFT, userId },
      };
    }

    return where;
  }

  private buildSearchWhereClause(
    userId: string,
    searchQuery: string,
    options: {
      status?: MessageStatus | 'all';
      provider?: EmailProvider | 'all';
    }
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {
      userId,
      OR: [
        { subject: { contains: searchQuery, mode: 'insensitive' } },
        { snippet: { contains: searchQuery, mode: 'insensitive' } },
        { participants: { has: searchQuery } },
      ],
    };

    if (options.status && options.status !== 'all') {
      where.messages = {
        some: { status: options.status, status: { not: MessageStatus.DELETED } },
      };
    }

    if (options.provider && options.provider !== 'all') {
      where.messages = {
        ...(where.messages as object),
        some: { provider: options.provider },
      };
    }

    return where;
  }

  private buildThreadOrderBy(query: ThreadListQuery): Record<string, string> {
    const sortBy = query.sortBy ?? 'lastMessageAt';
    const sortOrder = query.sortOrder ?? 'desc';
    return { [sortBy]: sortOrder };
  }

  private extractParticipants(
    to: string[],
    cc?: string[],
    bcc?: string[]
  ): string[] {
    const all = [...to, ...(cc ?? []), ...(bcc ?? [])];
    return [...new Set(all)];
  }

  private generateMessageId(): string {
    return `<${Date.now()}.${Math.random().toString(36).substring(2, 11)}@warpspeed>`;
  }

  private async updateThreadRecency(threadId: string, timestamp: Date): Promise<void> {
    await prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: timestamp },
    });
  }
}

export const emailThreadService = new EmailThreadService();
