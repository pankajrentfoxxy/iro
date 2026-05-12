import type { Request, Response, NextFunction } from "express";
import { ok } from "../../lib/response.js";
import { leadershipService } from "./leadership.service.js";

export async function postRecalculateSelf(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await leadershipService.recalculateUser(req.user!.id);
    ok(res, { score: row });
  } catch (e) {
    next(e);
  }
}
