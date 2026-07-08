import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const prisma = new PrismaClient();

interface EmailThread {
  id: string;
  subject: string;
  snippet: string;
  lastMessageDate: Date;
  messageCount: number;
  participants: string[];
  is Starred: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  isDraft: boolean;
}

interface EmailThreadMessage {
  id: string;
  threadId: string;
  subject: string;
  snippet: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  date: Date;
  isDraft: boolean;
  isSent: boolean;
  isStarred: boolean;
  isArchived: boolean;
  isDeleted: boolean;
}

const router = Router();

// Get all email threads for authenticated user
router.get('/threads', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, search, sortBy = 'lastMessageDate', order = 'desc' } = req.query;
    
    // Get user's email accounts
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { userId: userId },
      select: { id: true, emailId: true }
    });

    const emailIds = emailAccounts.map(account => account.emailId);
    
    // Get all threads for the user
    const threads = await prisma.$queryRaw`
      SELECT 
        t.id,
        t.subject,
        t.lastMessageDate,
        COUNT(m.id) as messageCount
      FROM "EmailThread" t
      LEFT JOIN "EmailThreadMessage" m ON t.id = m."threadId"
      WHERE t."userId" = ${userId}
      GROUP BY t.id
      ORDER BY t."lastMessageDate" DESC
    `;

    res.json(threads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

// Get specific thread with messages
router.get('/threads/:threadId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const userId = (req as any).user.id;
    
    // Get thread and its messages
    const thread = await prisma.emailThread.findUnique({
      where: { id: threadId },
      include: {
        messages: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    res.json(thread);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
});

// Get user's email threads with search and filtering
router.get('/messages', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { search, filter, page = 1, limit = 20 } = req.query;
    
    // Search implementation would go here
    const messages = await prisma.emailThreadMessage.findMany({
      where: {
        userId: userId,
        subject: {
          contains: search
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json({
      messages,
      pagination: {
        page,
        limit,
        total: messages.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;