import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { ValidationError } from "../../lib/errors.js";
import { referralService } from "./referral.service.js";

const depthSchema = z.object({
  maxDepth: z.coerce.number().min(1).max(8).optional(),
});

function parseQuery(schema: z.ZodType<unknown>, q: unknown) {
  const r = schema.safeParse(q);
  if (!r.success) throw new ValidationError("Invalid query", r.error.flatten());
  return r.data;
}

export async function getReferralTree(req: Request, res: Response, next: NextFunction) {
  try {
    const q = parseQuery(depthSchema, req.query) as { maxDepth?: number };
    const depth = q.maxDepth ?? 4;
    const tree = await referralService.treeForUser(req.user!.id, depth, req.user!);
    ok(res, { tree });
  } catch (e) {
    next(e);
  }
}

export async function getReferralLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const board = await referralService.leaderboard(req.user!, Number.isFinite(limit) ? limit : 50);
    ok(res, { leaderboard: board });
  } catch (e) {
    next(e);
  }
}
