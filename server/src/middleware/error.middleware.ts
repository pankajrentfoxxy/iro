import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { fail } from "../lib/response.js";
import { logger } from "../lib/logger.js";

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return fail(res, err.statusCode, err.message, err.code, err.details);
  }
  logger.error("Unhandled error", err instanceof Error ? err.message : err);
  return fail(res, 500, "Internal server error", "INTERNAL");
}
