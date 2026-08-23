import { prisma } from '../lib/prisma';

export class ThreadsService {
  async listThreads(userId: string, filters: any = {}) {
    return prisma.thread.findMany({
      where: {
        userId,
        ...filters,
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      include: {
        messages: {
          where: {
            isArchived: false,
            isDeleted: false,
          },
          orderBy: {
            sentAt: 'asc',
          },
        },
      },
    });
  }

  async getThread(threadId: string, userId: string) {
    return prisma.thread.findFirst({
      where: {
        id: threadId,
        userId,
      },
      include: {
        messages: {
          where: {
            isArchived: false,
            isDeleted: false,
          },
          orderBy: {
            sentAt: 'asc',
          },
        },
      },
    });
  }

  async createDraft(threadId: string | undefined, userId: string, data: any) {
    if (threadId) {
      await prisma.thread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() },
      });
    } else {
      const thread = await prisma.thread.create({
        data: {
          userId,
          subject: data.subject || 'No Subject',
          lastMessageAt: new Date(),
        },
      });
      threadId = thread.id;
    }

    return prisma.message.create({
      data: {
        ...data,
        threadId,
        userId,
        isDraft: true,
      },
    });
  }

  async updateDraft(messageId: string, userId: string, data: any) {
    const message = await prisma.message.findFirst({
      where: { id: messageId, userId, isDraft: true },
    });

    if (!message) throw new Error('Draft not found');

    await prisma.thread.update({
      where: { id: message.threadId! },
      data: { lastMessageAt: new Date() },
    });

    return prisma.message.update({
      where: { id: messageId },
      data,
    });
  }

  async sendDraft(messageId: string, userId: string) {
    const message = await prisma.message.findFirst({
      where: { id: messageId, userId, isDraft: true },
    });

    if (!message) throw new Error('Draft not found');

    await prisma.thread.update({
      where: { id: message.threadId! },
      data: { lastMessageAt: new Date() },
    });

    return prisma.message.update({
      where: { id: messageId },
      data: {
        isDraft: false,
        sentAt: new Date(),
      },
    });
  }
}