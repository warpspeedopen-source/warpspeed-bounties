/**
 * Auth Middleware - Authentication & Authorization
 * 
 * Express middleware for JWT authentication and request principal attachment.
 */

import { Request, Response, NextFunction } from "express";
import { Principal } from "../models";
import { Unauthorized } from "../errors";
import { ThreadRepository } from "../repositories/thread.repository";

/**
 * Extract Bearer token from Authorization header and resolve the principal.
 * Attaches the principal to req.user for downstream handlers.
 */
export function createAuthMiddleware(repo: ThreadRepository) {
  return async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw Unauthorized("missing or invalid authorization header");
      }

      const token = authHeader.slice(7); // Remove "Bearer " prefix
      const principal = await repo.getUserByToken(token);

      if (!principal) {
        throw Unauthorized("invalid or expired token");
      }

      (req as Request & { user: Principal }).user = principal;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Export a default instance for convenience (will be wired in app.ts)
export let authMiddleware: ReturnType<typeof createAuthMiddleware>;

export function setAuthMiddleware(middleware: typeof authMiddleware): void {
  authMiddleware = middleware;
}
