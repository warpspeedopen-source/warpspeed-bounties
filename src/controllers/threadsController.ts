import { Request, Response } from 'express';
import { threadsService } from '../services/threadsService';

export class ThreadsController {
  async listThreads(req: Request, res: Response) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const search = req.query.search as string | undefined;
      const threads = await threadsService.listThreads(userId, { search });
      res.json(threads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getThread(req: Request, res: Response) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const thread = await threadsService.getThread(userId, id);
      res.json(thread);
    } catch (error: any) {
      if (error.message === 'Thread not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async createDraft(req: Request, res: Response) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { body } = req.body;
      const draft = await threadsService.createDraft(userId, id, body);
      res.status(201).json(draft);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const threadsController = new ThreadsController();
