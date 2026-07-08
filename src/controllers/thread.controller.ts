import { Request, Response } from 'express';
import { prisma } from '../utils/prisma.client';
import { authenticateUser } from '../middleware/auth.middleware';

class ThreadController {
  // List email threads for authenticated user
  async listThreads(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, search, folder } = req.query;
      
      // Build where conditions
      const where: any = {
        userId,
        deleted: false
      };

      if (folder === 'archived') {
        where.archived = true;
      } else {
        where.archived = false;
      }

      // Search functionality
      if (search) {
        where.OR = [
          { subject: { contains: search, mode: 'insensitive' } },
          { messages: { some: { content: { contains: search, mode: 'insensitive' } } } }
        ];
      }

      const threads = await prisma.thread.findMany({
        where,
        include: {
          messages: {
            where: {
              deleted: false
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          lastActivity: 'desc'
        },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: threads,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get single thread with messages
  async getThread(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { threadId } = req.params;

      const thread = await prisma.thread.findUnique({
        where: {
          id: threadId,
          userId
        },
        include: {
          messages: {
            where: {
              deleted: false
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });

      if (!thread) {
        return res.status(404).json({ success: false, message: 'Thread not found' });
      }

      res.json({
        success: true,
        data: thread
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new ThreadController();