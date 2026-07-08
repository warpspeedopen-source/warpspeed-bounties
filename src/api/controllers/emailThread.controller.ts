import { Request, Response, NextFunction } from 'express';
import { EmailThreadService } from '../../services/emailThread.service';
import { AuthenticatedRequest } from '../types';

export class EmailThreadController {
  private service: EmailThreadService;

  constructor() {
    this.service = new EmailThreadService();
  }

  listThreads = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const {
        page = '1',
        limit = '20',
        folder,
        label,
        isRead,
        isStarred,
        accountId,
        sortBy = 'lastActivityAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await this.service.listThreads({
        userId,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        folder: folder as string | undefined,
        label: label as string | undefined,
        isRead: isRead !== undefined ? isRead === 'true' : undefined,
        isStarred: isStarred !== undefined ? isStarred === 'true' : undefined,
        accountId: accountId as string | undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getThread = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { threadId } = req.params;

      const thread = await this.service.getThread(userId, threadId);
      res.json(thread);
    } catch (error) {
      next(error);
    }
  };

  searchThreads = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const {
        q,
        page = '1',
        limit = '20',
        filters
      } = req.query;

      const result = await this.service.searchThreads({
        userId,
        query: q as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        filters: filters ? JSON.parse(filters as string) : undefined
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  updateThread = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { threadId } = req.params;

      const updated = await this.service.updateThread(userId, threadId, req.body);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  };

  deleteThread = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { threadId } = req.params;

      await this.service.deleteThread(userId, threadId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}