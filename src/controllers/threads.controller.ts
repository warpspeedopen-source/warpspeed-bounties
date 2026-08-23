import { Request, Response } from 'express';
import { ThreadsService } from '../services/threads.service';

const threadsService = new ThreadsService();

export class ThreadsController {
  async list(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const filters = req.query;
    try {
      const threads = await threadsService.listThreads(userId, filters);
      res.json(threads);
    } catch (error) {
      res.status(500).json({ error: 'Failed to list threads' });
    }
  }

  async get(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const { threadId } = req.params;
    try {
      const thread = await threadsService.getThread(threadId, userId);
      if (!thread) return res.status(404).json({ error: 'Thread not found' });
      res.json(thread);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get thread' });
    }
  }

  async createDraft(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const { threadId } = req.query;
    try {
      const draft = await threadsService.createDraft(threadId as string | undefined, userId, req.body);
      res.status(201).json(draft);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create draft' });
    }
  }

  async updateDraft(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const { messageId } = req.params;
    try {
      const draft = await threadsService.updateDraft(messageId, userId, req.body);
      res.json(draft);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update draft' });
    }
  }

  async sendDraft(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const { messageId } = req.params;
    try {
      const message = await threadsService.sendDraft(messageId, userId);
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: 'Failed to send draft' });
    }
  }
}