import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// Extend express request
declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string };
  }
}

// Mock auth middleware
app.use((req, res, next) => {
  req.user = { id: req.headers['x-user-id'] as string || 'user-1' };
  next();
});

// 1. List email threads
app.get('/api/threads', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const threads = await prisma.thread.findMany({
      where: { userId },
      include: {
        messages: {
          where: {
            isArchived: false,
            isDeleted: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const formattedThreads = threads.map((thread) => ({
      threadId: thread.id,
      subject: thread.subject,
      lastUpdated: thread.updatedAt,
      messageCount: thread.messages.length,
      latestMessage: thread.messages[0] || null,
      messages: thread.messages,
    }));

    return res.status(200).json({ success: true, data: formattedThreads });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Open a single thread
app.get('/api/threads/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const threadId = req.params.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        messages: {
          where: {
            isArchived: false,
            isDeleted: false,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!thread || thread.userId !== userId) {
      return res.status(404).json({ error: 'Thread not found or unauthorized' });
    }

    return res.status(200).json({ success: true, data: thread });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Draft Integration
app.post('/api/threads/:id/drafts', async (req: Request, res: Response) => {
  try {
    const { body } = req.body;
    const userId = req.user?.id;
    const threadId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const thread = await prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread || thread.userId !== userId) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const [draft] = await prisma.$transaction([
      prisma.message.create({
        data: {
          body,
          threadId,
          userId,
          isDraft: true,
        },
      }),
      prisma.thread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return res.status(201).json({ success: true, data: draft, threadStatus: 'updated' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default app;
