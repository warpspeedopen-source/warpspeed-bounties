import { Router, Request, Response } from 'express';
import { threadListQuerySchema, threadParamsSchema } from '../schemas.js';
import { listThreads, getThreadById } from '../services/thread-service.js';

const router = Router();

/**
 * GET /api/threads
 * List email threads with optional filtering, search, and pagination.
 */
router.get('/threads', async (req: Request, res: Response) => {
  try {
    const query = threadListQuerySchema.parse(req.query);
    const result = await listThreads(query);
    res.json(result);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors ?? error,
      });
      return;
    }
    console.error('Error listing threads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/threads/:id
 * Get a single thread with all its messages.
 */
router.get('/threads/:id', async (req: Request, res: Response) => {
  try {
    const { id } = threadParamsSchema.parse(req.params);
    const thread = await getThreadById(id);

    if (!thread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    res.json(thread);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({
        error: 'Invalid thread ID',
        details: error.errors ?? error,
      });
      return;
    }
    console.error('Error getting thread:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
