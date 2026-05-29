import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ThreadsService {
  async listThreads(userId: string, options: { search?: string; includeDrafts?: boolean } = {}) {
    const { search } = options;
    return prisma.thread.findMany({
      where: {
        ownerId: userId,
        isArchived: false,
        isDeleted: false,
        ...(search ? {
          OR: [
            { subject: { contains: search } },
            { messages: { some: { body: { contains: search } } } }
          ]
        } : {})
      },
      orderBy: { lastActivity: 'desc' },
      include: {
        messages: {
          where: {
            isArchived: false,
            isDeleted: false,
            ...(options.includeDrafts === false ? { isDraft: false } : {})
          },
          orderBy: { createdAt: 'desc' },
          take: 1, // Get the latest message for preview
        },
      },
    });
  }

  async getThread(userId: string, threadId: string) {
    const thread = await prisma.thread.findFirst({
      where: {
        id: threadId,
        ownerId: userId,
        isArchived: false,
        isDeleted: false,
      },
      include: {
        messages: {
          where: {
            isArchived: false,
            isDeleted: false,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    
    if (!thread) {
      throw new Error('Thread not found');
    }
    return thread;
  }

  async createDraft(userId: string, threadId: string, body: string) {
    const thread = await prisma.thread.findFirst({
      where: { id: threadId, ownerId: userId }
    });

    if (!thread) {
      throw new Error('Thread not found');
    }

    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: userId,
        body,
        isDraft: true,
      }
    });

    await prisma.thread.update({
      where: { id: threadId },
      data: { lastActivity: new Date() }
    });

    return message;
  }
}

export const threadsService = new ThreadsService();
