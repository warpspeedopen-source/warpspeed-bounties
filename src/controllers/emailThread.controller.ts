import { Request, Response, NextFunction } from 'express';
import { EmailThreadService } from '../services/email-thread.service';

const emailThreadService = new EmailThreadService();

export class EmailThreadController {
  async getThreads(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const threads = await emailThreadService.getThreads(userId);
      return res.status(200).json(threads);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  async getThreadDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { threadId } = req.params;
      const userId = req.user.id;
      const thread = await emailThreadService.getThreadDetail(userId, threadId);
      return res.status(200).json(thread);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async createThread(req: Request, res: Response, next: NextFunction) {
    try {
      const threadData = req.body;
      const newThread = await emailThreadService.createThread(threadData);
      return res.status(201).json(newThread);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async updateThread(req: Request, res: Response, next: NextFunction) {
    try {
      const { threadId } = req.params;
      const updateData = req.body;
      const updated = await emailThreadService.updateThread(threadId, updateData);
      return res.status(200).json(updated);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async deleteThread(req: Request, res: Response, next) {
    try {
      const { threadId } = req.params;
      await emailThreadService.deleteThread(threadId);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}