/**
 * API Error Classes for Email Threads API
 * 
 * Standardized error types for consistent API responses.
 */

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const NotFound = (what: string): ApiError =>
  new ApiError(404, "not_found", `${what} not found`);

export const Forbidden = (msg = "forbidden"): ApiError =>
  new ApiError(403, "forbidden", msg);

export const Unauthorized = (msg = "unauthorized"): ApiError =>
  new ApiError(401, "unauthorized", msg);

export const BadRequest = (msg: string, details?: unknown): ApiError =>
  new ApiError(400, "bad_request", msg, details);
