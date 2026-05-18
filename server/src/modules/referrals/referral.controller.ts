import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { ValidationError } from "../../lib/errors.js";
import { referralInviteService } from "../referral-invites/referralInvite.service.js";
import { referralService } from "./referral.service.js";

const depthSchema = z.object({
  maxDepth: z.coerce.number().min(1).max(8).optional(),
});

function parseQuery(schema: z.ZodType<unknown>, q: unknown) {
  const r = schema.safeParse(q);
  if (!r.success) throw new ValidationError("Invalid query", r.error.flatten());
  return r.data;
}

const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.string().min(2),
});

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) throw new ValidationError("Invalid body", r.error.flatten());
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

export async function getReferralStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await referralService.stats(req.user!.id);
    ok(res, stats);
  } catch (e) {
    next(e);
  }
}

export async function postAssignReferralRole(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parseBody(assignRoleSchema, req.body);
    const updated = await referralService.assignRole(req.user!, body.userId, body.role);
    ok(res, { user: updated });
  } catch (e) {
    next(e);
  }
}

export async function getMyReferralNetwork(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await referralInviteService.myNetwork(req.user!);
    ok(res, data);
  } catch (e) {
    next(e);
  }
}
