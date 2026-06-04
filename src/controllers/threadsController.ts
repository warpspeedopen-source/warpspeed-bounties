import { Request, Response } from 'express';
import { threadsService, NotFoundError } from '../services/threadsService';
import { ListThreadsQuerySchema, CreateDraftSchema } from '../types';

export class ThreadsController {
  /**
   * GET /api/threads
   * List threads with search, folder filter, and pagination.
   */
  async listThreads(req: Request, res: Response): Promise<void> {
    try {
      const auth = req.auth!;

      const parsed = ListThreadsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
        });
        return;
      }

      const result = await threadsService.listThreads(auth, parsed.data);
      res.json(result);
    } catch (err: any) {
      console.error('listThreads error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  /**
   * GET /api/threads/:id
   * Get a single thread with all messages.
   */
  async getThread(req: Request, res: Response): Promise<void> {
    try {
      const auth = req.auth!;
      const { id } = req.params;

      const thread = await threadsService.getThread(auth, id);
      res.json(thread);
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
        return;
      }
      console.error('getThread error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  /**
   * POST /api/threads/:id/drafts
   * Create a draft in a thread and update its recency.
   */
  async createDraft(req: Request, res: Response): Promise<void> {
    try {
      const auth = req.auth!;
      const { id } = req.params;

      const parsed = CreateDraftSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Invalid request body',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
        });
        return;
      }

      const draft = await threadsService.createDraft(auth, id, parsed.data);
      res.status(201).json(draft);
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
        return;
      }
      console.error('createDraft error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  /**
   * POST /api/threads/:id/drafts/:draftId/send
   * Send a draft (convert to sent message).
   */
  async sendDraft(req: Request, res: Response): Promise<void> {
    try {
      const auth = req.auth!;
      const { id, draftId } = req.params;

      const sent = await threadsService.sendDraft(auth, id, draftId);
      res.json(sent);
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
        return;
      }
      console.error('sendDraft error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  /**
   * POST /api/threads/:id/drafts
   * Alias: POST /api/threads/provider/sync
   * Import a provider message (Gmail/Outlook/IMAP) and thread it correctly.
   */
  async importProviderMessage(req: Request, res: Response): Promise<void> {
    try {
      const auth = req.auth!;

      const message = await threadsService.importProviderMessage(auth, req.body);
      res.status(201).json(message);
    } catch (err: any) {
      console.error('importProviderMessage error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }
}

export const threadsController = new ThreadsController();
