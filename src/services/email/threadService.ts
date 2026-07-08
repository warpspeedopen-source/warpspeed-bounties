import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../errors';

export class ThreadService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * List email threads for the authenticated user
   * @param userId - The ID of the authenticated user
   * @param limit - Number of threads to return per page
   * @param offset - Offset for pagination
   * @param includeArchived - Whether to include archived messages in threads
   * @param includeDeleted - Whether to include deleted messages in threads
   */
  async listThreads(userId: number, limit: number = 20, offset: number = 0, includeArchived: boolean = false, includeDeleted: boolean = false) {
    try {
      // Get all messages for the user
      const messages = await this.prisma.message.findMany({
        where: {
          userId: userId,
        },
        include: {
          account: true,
        },
        orderBy: {
          receivedAt: 'desc',
        },
      });

      // Group messages by thread
      const threadMap = new Map<string, any[]>();
      
      // Group messages by threadId
      messages.forEach(message => {
        const threadId = message.threadId;
        if (!threadMap.has(threadId)) {
          threadMap.set(threadId, []);
        }
        threadMap.get(threadId)!.push(message);
      });

      // Convert to array of threads with metadata
      const threads: any[] = [];
      threadMap.forEach((messages, threadId) => {
        // Calculate thread metadata
        const latestMessage = messages.reduce((latest, current) => 
          new Date(latest.receivedAt) > new Date(current.receivedAt) ? latest : current
        );
        
        const threadData = {
          id: threadId,
          subject: latestMessage.subject,
          from: latestMessage.from,
          to: latestMessage.to,
          cc: latestMessage.cc,
          bcc: latestMessage.bcc,
          replyTo: latestMessage.replyTo,
          latestReceivedAt: latestMessage.receivedAt,
          messageCount: messages.length,
          accountId: latestMessage.accountId,
          messageId: latestMessage.id,
        };
        
        threads.push(threadData);
      });
      
      // Apply filters
      let filteredThreads = threads;
      if (!includeArchived) {
        // Exclude archived messages
        filteredThreads = threads.filter(thread => 
          !thread.isArchived
        );
      }
      
      if (!includeDeleted) {
        // Exclude deleted messages
        filteredThreads = filteredThreads.filter(thread => 
          !thread.isDeleted
        );
      }
      
      // Apply pagination
      return filteredThreads.slice(offset, offset + limit);
    } catch (error) {
      throw new Error(`Error listing threads: ${error}`);
    }
  }

  /**
   * Get a single thread with related messages
   * @param threadId - The thread ID to retrieve
   */
  async getThread(threadId: string) {
    try {
      const threadMessages = await this.prisma.message.findMany({
        where: {
          threadId: threadId,
        },
        include: {
          account: true,
        },
        orderBy: {
          receivedAt: 'desc',
        },
      });

      if (!threadMessages || threadMessages.length === 0) {
        throw new NotFoundError('Thread not found');
      }

      return {
        messages: threadMessages,
        threadId: threadId,
      };
    } catch (error) {
      throw new Error(`Error getting thread: ${error}`);
    }
  }

  /**
   * Get thread metadata including message count and latest activity
   * @param threadId - The thread ID
   * @param userId - The user ID
   */
  getThreadMetadata(threadId: string, userId: number) {
    return {
      messageCount: 0,
      unreadCount: 0,
      userId: userId,
    };
  }

  /**
   * Update thread recency for drafts
   * @param threadId - The thread ID
   * @param accountId - The account ID
   * @param draftId - The draft message ID
   */
  async updateThreadRecency(threadId: string, accountId: number, draftId: number) {
    try {
      // Get the thread
      const thread = await this.prisma.thread.findUnique({
        where: { id: threadId },
      });

      if (!thread) {
        throw new NotFoundError('Thread not found');
      }

      // Update the thread's updatedAt timestamp
      await this.prisma.thread.update({
        where: { id: threadId },
        data: {
          updatedAt: new Date(),
        },
      });

      // Also update the message that was part of this thread
      await this.prisma.message.update({
        where: { id: draftId },
        data: {
          threadId: threadId,
        },
      });
      
      return thread;
    } catch (error) {
      throw new Error(`Error updating thread recency: ${error}`);
    }
  }
}