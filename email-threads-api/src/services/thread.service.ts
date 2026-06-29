import { PrismaClient } from '@prisma/client';
import { ThreadSummary, ThreadDetail, ThreadListOptions, ThreadListResult, DraftUpdate, MessageSummary } from '../types';

export class ThreadService {
  constructor(private prisma: PrismaClient) {}

  async listThreads(userId: string, options: ThreadListOptions): Promise<ThreadListResult> {
    const { page = 1, limit = 20, search, isArchived, includeDeleted } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      ownerId: userId,
      isDeleted: includeDeleted ? undefined : false,
      isArchived: isArchived !== undefined ? isArchived : undefined,
    };

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { messages: { some: { body: { contains: search, mode: 'insensitive' } } } },
        { participants: { some: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [threads, total] = await Promise.all([
      this.prisma.thread.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          participants: true,
          reads: { where: { userId } },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.thread.count({ where }),
    ]);

    return {
      threads: threads.map(t => ({
        id: t.id,
        subject: t.subject,
        snippet: t.snippet,
        lastMessageAt: t.lastMessageAt,
        messageCount: t._count.messages,
        isArchived: t.isArchived,
        participants: t.participants.map(p => p.email),
        unreadCount: t.reads.length === 0 ? t._count.messages : 0,
      })),
      total,
      page,
      limit,
    };
  }

  async getThread(threadId: string, userId: string): Promise<ThreadDetail | null> {
    const thread = await this.prisma.thread.findFirst({
      where: { id: threadId, ownerId: userId, isDeleted: false },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        participants: true,
        reads: { where: { userId } },
      },
    });

    if (!thread) return null;

    // Mark as read
    await this.prisma.threadRead.upsert({
      where: { userId_threadId: { userId, threadId } },
      create: { userId, threadId, readAt: new Date() },
      update: { readAt: new Date() },
    });

    return {
      id: thread.id,
      subject: thread.subject,
      snippet: thread.snippet,
      lastMessageAt: thread.lastMessageAt,
      messageCount: thread.messages.length,
      isArchived: thread.isArchived,
      participants: thread.participants.map(p => p.email),
      unreadCount: 0,
      messages: thread.messages.map(m => ({
        id: m.id,
        subject: m.subject,
        snippet: m.snippet,
        fromAddress: m.fromAddress,
        toAddresses: m.toAddresses,
        ccAddresses: m.ccAddresses,
        messageType: m.messageType as MessageSummary['messageType'],
        createdAt: m.createdAt,
      })),
    };
  }

  async saveDraft(userId: string, threadId: string, update: DraftUpdate): Promise<MessageSummary> {
    const thread = await this.prisma.thread.findFirst({
      where: { id: threadId, ownerId: userId },
    });
    if (!thread) throw new Error('Thread not found');

    let draft = await this.prisma.message.findFirst({
      where: { threadId, messageType: 'DRAFT', ownerId: userId },
    });

    if (draft) {
      draft = await this.prisma.message.update({
        where: { id: draft.id },
        data: {
          body: update.body,
          subject: update.subject ?? draft.subject,
          toAddresses: update.toAddresses ?? draft.toAddresses,
          ccAddresses: update.ccAddresses ?? draft.ccAddresses,
        },
      });
    } else {
      draft = await this.prisma.message.create({
        data: {
          threadId,
          ownerId: userId,
          body: update.body,
          subject: update.subject,
          messageType: 'DRAFT',
          fromAddress: '',
          toAddresses: update.toAddresses ?? [],
          ccAddresses: update.ccAddresses ?? [],
        },
      });
    }

    // Update thread recency
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });

    return {
      id: draft.id,
      subject: draft.subject,
      snippet: draft.body.substring(0, 100),
      fromAddress: draft.fromAddress,
      toAddresses: draft.toAddresses,
      ccAddresses: draft.ccAddresses,
      messageType: 'DRAFT',
      createdAt: draft.createdAt,
    };
  }

  async archiveThread(threadId: string, userId: string): Promise<void> {
    await this.prisma.thread.updateMany({
      where: { id: threadId, ownerId: userId },
      data: { isArchived: true },
    });
  }

  async deleteThread(threadId: string, userId: string): Promise<void> {
    await this.prisma.thread.updateMany({
      where: { id: threadId, ownerId: userId },
      data: { isDeleted: true },
    });
  }
}
