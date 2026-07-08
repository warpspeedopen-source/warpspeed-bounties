import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ThreadQueryParams {
  limit?: number;
  offset?: number;
  search?: string;
  accountId?: string;
  includeArchived?: boolean;
  includeDeleted?: boolean;
}

interface ThreadResponse {
  id: string;
  subject: string;
  snippet: string;
  messageCount: number;
  unreadCount: number;
  participants: Array<{
    name: string;
    email: string;
  }>;
  lastMessageAt: Date;
  isArchived: boolean;
  isDeleted: boolean;
  accountId: string;
}

/**
 * List email threads for the authenticated user
 * GET /api/v1/email-threads
 */
export const listEmailThreads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      limit = 20,
      offset = 0,
      search,
      accountId,
      includeArchived = false,
      includeDeleted = false
    } = req.query as ThreadQueryParams;

    // Build where conditions
    const where: any = {
      userId: req.user.id // Assuming auth middleware sets req.user
    };

    if (accountId) {
      where.accountId = accountId;
    }

    if (!includeArchived) {
      where.isArchived = false;
    }

    if (!includeDeleted) {
      where.isDeleted = false;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { messages: { some: { body: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    // Fetch threads with message counts
    const threads = await prisma.thread.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: {
        lastMessageAt: 'desc'
      },
      include: {
        messages: {
          where: {
            isDeleted: includeDeleted ? undefined : false,
            isArchived: includeArchived ? undefined : false
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: {
                isDeleted: includeDeleted ? undefined : false,
                isArchived: includeArchived ? undefined : false,
                isDraft: false
              }
            }
          }
        }
      }
    });

    // Transform to response format
    const threadsResponse: ThreadResponse[] = threads.map(thread => {
      const latestMessage = thread.messages[0];
      return {
        id: thread.id,
        subject: thread.subject,
        snippet: latestMessage?.snippet || '',
        messageCount: thread._count.messages,
        unreadCount: thread.messages.filter(m => !m.isRead).length,
        participants: thread.participants as any,
        lastMessageAt: thread.lastMessageAt,
        isArchived: thread.isArchived,
        isDeleted: thread.isDeleted,
        accountId: thread.accountId
      };
    });

    res.json({
      threads: threadsResponse,
      pagination: {
        limit,
        offset,
        total: threads.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single thread with related messages
 * GET /api/v1/email-threads/:id
 */
export const getEmailThread = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { includeDrafts = true } = req.query;

    const thread = await prisma.thread.findUnique({
      where: {
        id,
        userId: req.user.id
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          where: {
            ...(includeDrafts ? {} : { isDraft: false })
          }
        }
      }
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Mark messages as read when opening thread
    await prisma.message.updateMany({
      where: {
        threadId: thread.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({
      id: thread.id,
      subject: thread.subject,
      messages: thread.messages,
      createdAt: thread.createdAt,
      lastMessageAt: thread.lastMessageAt,
      isArchived: thread.isArchived,
      isDeleted: thread.isDeleted,
      accountId: thread.accountId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update thread recency when drafts are created/updated
 */
export const updateThreadRecency = async (threadId: string, userId: string) => {
  try {
    await prisma.thread.update({
      where: {
        id: threadId,
        userId
      },
      data: {
        lastMessageAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating thread recency:', error);
  }
};