import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../lib/errors.js";
import { canAccessAdminPanel } from "../lib/rbac.js";

export function requireAdminPanel(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(new ForbiddenError());
    return;
  }
  if (!canAccessAdminPanel(req.user.role?.levelCode)) {
    next(new ForbiddenError("Administrator role required (L1–L6)"));
    return;
  }
  next();
}
