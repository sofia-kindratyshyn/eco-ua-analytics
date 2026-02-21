import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { isDevelopment } from "../config/env";
import { AppError, formatErrorResponse } from "../utils/errors";

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction // Prefix with underscore to indicate intentionally unused
) {
  // Log error
  logger.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Format error response
  const errorResponse = formatErrorResponse(err);

  // Add stack trace in development
  if (isDevelopment && err.stack) {
    (errorResponse as any).stack = err.stack;
  }

  // Send response
  res.status(errorResponse.statusCode).json(errorResponse);
}

// Not found handler
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.url} not found`,
  });
}

// Async handler wrapper to catch errors in async route handlers
// UPDATED: Now accepts functions with 2 or 3 parameters
export function asyncHandler(
  fn: (req: Request, res: Response, next?: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
