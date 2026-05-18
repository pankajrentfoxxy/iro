import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { ValidationError } from "../../lib/errors.js";
import { referralInviteService } from "./referralInvite.service.js";
import {
  createReferralInviteSchema,
} from "./referralInvite.validation.js";

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) throw new ValidationError("Invalid body", r.error.flatten());
  return r.data;
}

export async function getAllowedTargets(req: Request, res: Response, next: NextFunction) {
  try {
    const levels = referralInviteService.allowedTargets(req.user!);
    ok(res, { levels });
  } catch (e) {
    next(e);
  }
}

export async function postReferralInvite(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parseBody(createReferralInviteSchema, req.body);
    const out = await referralInviteService.createInvite(req.user!, body, {
      ip: req.ip ?? null,
    });
    ok(res, { code: out.code, targetRole: out.targetRole, maxUses: out.maxUses }, 201);
  } catch (e) {
    next(e);
  }
}

export async function getMyReferralInvites(req: Request, res: Response, next: NextFunction) {
  try {
    const invites = await referralInviteService.listMine(req.user!);
    ok(res, { invites });
  } catch (e) {
    next(e);
  }
}
