import { PrismaClient, PrismaPromise } from '@prisma/client';

const prisma = new PrismaClient();

export class EmailThreadService {
  static async getThreads(userId: string) {
    return await prisma.emailThread.findMany({
      where: {
        userId: userId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          }
        }
      }
    });
  }

  static async getThreadById(threadId: string) {
    return await prisma.emailThread.findUnique({
      where: {
        id: threadId,
      },
      include: {
        messages: true,
      }
    });
  }

  static async createThread(data: any) {
    const thread = await prisma.emailThread.create({
      data: data
    });
    return thread;
  }

  static async updateThread(threadId: string, data: any) {
    return await prisma.emailThread.update({
      where: { id: threadId },
      data: data
    });
  }

  static async getThreadWithMessages(threadId: string) {
    return await prisma.emailThread.findUnique({
      where: { id: threadId },
      include: { messages: true }
    });
  }
}