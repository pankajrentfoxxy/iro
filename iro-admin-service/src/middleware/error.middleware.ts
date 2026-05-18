import type { NextFunction, Request, Response } from "express";
import { AppError, ValidationError } from "../lib/errors.js";
import { fail } from "../lib/response.js";
import { logger } from "../lib/logger.js";

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    const details = err instanceof ValidationError ? err.details : undefined;
    return fail(res, err.statusCode, err.message, err.code, details);
  }
  logger.error("Unhandled error", err instanceof Error ? err.message : err);
  return fail(res, 500, "Internal server error", "INTERNAL");
}
