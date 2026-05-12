import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db.js";
import { randomUUID } from "node:crypto";

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  req.requestId = randomUUID();
  const start = Date.now();
  res.on("finish", () => {
    void (async () => {
      try {
        const userId = req.user?.id ?? null;
        await prisma.auditLog.create({
          data: {
            userId,
            method: req.method,
            path: req.originalUrl.split("?")[0] ?? req.originalUrl,
            statusCode: res.statusCode,
            ip: req.ip,
            userAgent: req.get("user-agent") ?? null,
            metadata: {
              requestId: req.requestId,
              durationMs: Date.now() - start,
            },
          },
        });
      } catch {
        /* avoid breaking response */
      }
    })();
  });
  next();
}
