/**
 * Thread Routes - API Route Definitions
 * 
 * Express router for the Email Threads API endpoints.
 */

import { Router } from "express";
import { ThreadController } from "../controllers/thread.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export function createThreadRoutes(controller: ThreadController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  // Thread endpoints
  router.get("/threads", controller.listThreads.bind(controller));
  router.get("/threads/search", controller.searchThreads.bind(controller));
  router.get("/threads/:id", controller.getThread.bind(controller));
  router.post("/threads/:id/drafts", controller.upsertDraft.bind(controller));
  router.post("/drafts/:id/send", controller.sendDraft.bind(controller));

  return router;
}
