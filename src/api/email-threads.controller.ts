import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ThreadQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  filter?: 'inbox' | 'sent' | 'drafts' | 'archived' | 'starred';
  sortOrder?: 'newest' | 'oldest';
}

/**
 * List email threads for the authenticated user
 * GET /api/v1/email-threads
 */
export const listThreads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id; // Assuming user is attached to request via auth middleware
    const { page = 1, limit = 20, search, filter, sortOrder = 'newest' } = req.query as any;
    
    // Build where conditions
    const where: any = {
      userId,
      deleted: false,
    };

    // Apply filters
    if (filter) {
      switch (filter) {
        case 'inbox':
          where.folder = 'inbox';
          break;
        case 'sent':
          where.folder = 'sent';
          break;
        case 'drafts':
          where.folder = 'drafts';
          break;
        case 'archived':
          where.archived = true;
          break;
        case 'starred':
          where.starred = true;
          break;
      }
    }

    // Apply search filter
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { messages: { some: { body: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    // Fetch threads with pagination
    const skip = (page - 1) * limit;
    const threads = await prisma.thread.findMany({
      where: {
        userId,
        deleted: false,
        ...where
      },
      include: {
        messages: {
          where: {
            deleted: false
          },
          orderBy: {
            date: sortOrder === 'newest' ? 'desc' : 'asc'
          },
          take: 1 // Only get the most recent message for thread preview
        }
      },
      orderBy: {
        lastMessageDate: sortOrder === 'newest' ? 'desc' : 'asc'
      },
      skip,
      take: parseInt(limit as string)
    });

    // Get total count for pagination
    const total = await prisma.thread.count({
      where: {
        userId,
        deleted: false,
        ...where
      }
    });

    res.json({
      threads,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single thread with all its messages
 * GET /api/v1/email-threads/:threadId
 */
export const getThread = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { threadId } = req.params;

    const thread = await prisma.thread.findFirst({
      where: {
        id: threadId,
        userId,
        deleted: false
      },
      include: {
        messages: {
          where: {
            deleted: false
          },
          orderBy: {
            date: 'asc'
          }
        }
      }
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    res.json(thread);
  } catch (error) {
    next(error);
  }
};