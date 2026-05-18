import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db.js";

/** Persist HTTP mutations for compliance */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const path = req.path;
  const method = req.method;

  res.on("finish", () => {
    if (!["POST", "PATCH", "PUT", "DELETE"].includes(method)) return;
    if (path.includes("/auth/login") || path.includes("/auth/refresh")) return;
    const uid = req.user?.id ?? null;
    void prisma.auditLog
      .create({
        data: {
          userId: uid,
          method,
          path: `${req.baseUrl || ""}${path}`,
          statusCode: res.statusCode,
          ip: req.ip,
          userAgent: req.headers["user-agent"]?.slice(0, 512) ?? null,
          metadata: { durationMs: Date.now() - start } as object,
        },
      })
      .catch(() => undefined);
  });

  next();
}
