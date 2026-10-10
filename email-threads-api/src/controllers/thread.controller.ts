/**
 * Thread Controller - Request Handlers
 * 
 * Express route handlers for the Email Threads API.
 * Validates input, calls the service layer, and formats responses.
 */

import { Request, Response, NextFunction } from "express";
import { ThreadService } from "../services/thread.service";
import { Principal, SearchQuery } from "../models";
import { ApiError } from "../errors";

export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  /**
   * @openapi
   * /threads:
   *   get:
   *     summary: List email threads for the authenticated user
   *     tags: [Threads]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 25, minimum: 1, maximum: 100 }
   *       - in: query
   *         name: cursor
   *         schema: { type: string }
   *         description: Opaque pagination cursor
   *     responses:
   *       200:
   *         description: Paginated list of thread summaries
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 items:
   *                   type: array
   *                   items: { $ref: '#/components/schemas/ThreadSummary' }
   *                 nextCursor:
   *                   type: string
   *                   nullable: true
   *       401: { $ref: '#/components/responses/Unauthorized' }
   */
  async listThreads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const principal = (req as Request & { user: Principal }).user;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
      const result = await this.threadService.listThreads(principal, { limit, cursor });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @openapi
   * /threads/{id}:
   *   get:
   *     summary: Open a single thread with related messages
   *     tags: [Threads]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Thread detail with messages
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ThreadDetail' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  async getThread(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const principal = (req as Request & { user: Principal }).user;
      const threadId = req.params.id;
      const thread = await this.threadService.getThread(principal, threadId);
      res.json(thread);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @openapi
   * /threads/search:
   *   get:
   *     summary: Search/filter messages grouped by thread
   *     tags: [Threads]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         schema: { type: string }
   *       - in: query
   *         name: from
   *         schema: { type: string }
   *       - in: query
   *         name: to
   *         schema: { type: string }
   *       - in: query
   *         name: subject
   *         schema: { type: string }
   *       - in: query
   *         name: hasDraft
   *         schema: { type: boolean }
   *       - in: query
   *         name: since
   *         schema: { type: integer }
   *       - in: query
   *         name: until
   *         schema: { type: integer }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 25 }
   *       - in: query
   *         name: cursor
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Search results grouped by thread
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 items:
   *                   type: array
   *                   items: { $ref: '#/components/schemas/ThreadSummary' }
   *                 nextCursor:
   *                   type: string
   *                   nullable: true
   */
  async searchThreads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const principal = (req as Request & { user: Principal }).user;
      const query: SearchQuery = {
        q: req.query.q ? String(req.query.q) : undefined,
        from: req.query.from ? String(req.query.from) : undefined,
        to: req.query.to ? String(req.query.to) : undefined,
        subject: req.query.subject ? String(req.query.subject) : undefined,
        hasDraft: req.query.hasDraft === "true",
        since: req.query.since ? Number(req.query.since) : undefined,
        until: req.query.until ? Number(req.query.until) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        cursor: req.query.cursor ? String(req.query.cursor) : undefined,
      };
      const result = await this.threadService.searchThreads(principal, query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @openapi
   * /threads/{id}/drafts:
   *   post:
   *     summary: Create or update a draft on a thread
   *     tags: [Threads]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               id: { type: string, description: Existing draft ID (for updates) }
   *               subject: { type: string }
   *               body: { type: string, required: true }
   *               to: { type: array, items: { type: string } }
   *               cc: { type: array, items: { type: string } }
   *               bcc: { type: array, items: { type: string } }
   *     responses:
   *       200:
   *         description: Draft created/updated
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Message' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  async upsertDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const principal = (req as Request & { user: Principal }).user;
      const threadId = req.params.id;
      const draft = req.body;
      const result = await this.threadService.upsertDraft(principal, threadId, draft);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @openapi
   * /drafts/{id}/send:
   *   post:
   *     summary: Send a previously saved draft
   *     tags: [Drafts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Draft sent
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Message' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  async sendDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const principal = (req as Request & { user: Principal }).user;
      const draftId = req.params.id;
      const result = await this.threadService.sendDraft(principal, draftId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
