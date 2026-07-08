import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const listThreadsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  search: z.string().optional(),
  folder: z.string().optional(),
  isRead: z.string().optional().transform((val) => val === 'true'),
  isStarred: z.string().optional().transform((val) => val === 'true'),
  hasAttachment: z.string().optional().transform((val) => val === 'true'),
  accountId: z.string().optional(),
  label: z.string().optional(),
});

const getThreadParamsSchema = z.object({
  threadId: z.string(),
});

router.get(
  '/threads',
  authenticateUser,
  validateQuery(listThreadsQuerySchema),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { page, limit, search, folder, isRead, isStarred, hasAttachment, accountId, label } = req.query as z.infer<typeof listThreadsQuerySchema>;

      const skip = (Math.max(1, page) - 1) * Math.min(50, limit);
      const take = Math.min(50, limit);

      const where: any = {
        userId,
        messages: {
          some: {
            isArchived: false,
            isDeleted: false,
          },
        },
      };

      if (accountId) {
        where.accountId = accountId;
      }

      if (folder) {
        where.messages.some.folder = folder;
      }

      if (isRead !== undefined) {
        where.messages.some.isRead = isRead;
      }

      if (isStarred !== undefined) {
        where.messages.some.isStarred = isStarred;
      }

      if (hasAttachment !== undefined) {
        where.messages.some.hasAttachment = hasAttachment;
      }

      if (label) {
        where.messages.some.labels = {
          has: label,
        };
      }

      if (search) {
        where.OR = [
          { subject: { contains: search, mode: 'insensitive' } },
          { messages: { some: { from: { contains: search, mode: 'insensitive' } } } },
          { messages: { some: { body: { contains: search, mode: 'insensitive' } } } },
        ];
      }

      const [threads, totalCount] = await Promise.all([
        prisma.emailThread.findMany({
          where,
          orderBy: {
            lastMessageAt: 'desc',
          },
          skip,
          take,
          include: {
            messages: {
              where: {
                isArchived: false,
                isDeleted: false,
              },
              orderBy: {
                sentAt: 'desc',
              },
              take: 1,
              select: {
                id: true,
                from: true,
                to: true,
                subject: true,
                isRead: true,
                isStarred: true,
                hasAttachment: true,
                sentAt: true,
                preview: true,
              },
            },
            _count: {
              select: {
                messages: true,
              },
            },
          },
        }),
        prisma.emailThread.count({ where }),
      ]);

      const formattedThreads = threads.map((thread) => ({
        ...thread,
        messageCount: thread._count.messages,
        _count: undefined,
      }));

      res.json({
        data: formattedThreads,
        pagination: {
          page,
          limit: take,
          totalCount,
          totalPages: Math.ceil(totalCount / take),
        },
      });
    } catch (error) {
      console.error('Error listing threads:', error);
      res.status(500).json({ error: 'Failed to list threads' });
    }
  }
);

router.get(
  '/threads/:threadId',
  authenticateUser,
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { threadId } = req.params;

      const thread = await prisma.emailThread.findFirst({
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
            include: {
              attachments: true,
            },
          },
          drafts: {
            where: {
              isDeleted: false,
              isSent: false,
            },
            orderBy: {
              updatedAt: 'desc',
            },
          },
        },
      });

      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      res.json({ data: thread });
    } catch (error) {
      console.error('Error fetching thread:', error);
      res.status(500).json({ error: 'Failed to fetch thread' });
    }
  }
);

export default router;