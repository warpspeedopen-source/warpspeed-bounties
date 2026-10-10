/**
 * Error Middleware - Global Error Handling
 * 
 * Express middleware for standardized API error responses.
 */

import { Request, Response, NextFunction } from "express";
import { ApiError } from "../errors";

/**
 * Global error handler. Converts ApiError instances to standardized JSON
 * responses. Unknown errors are logged and return a 500.
 */
export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (error instanceof ApiError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  // Log unexpected errors
  console.error("Unexpected error:", error);

  res.status(500).json({
    error: {
      code: "internal_error",
      message: "An unexpected error occurred",
    },
  });
}

/**
 * 404 handler for unmatched routes.
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: "not_found",
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
