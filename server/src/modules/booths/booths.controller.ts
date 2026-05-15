import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { ValidationError } from "../../lib/errors.js";
import { boothsService } from "./booths.service.js";

const moodSchema = z.object({
  sentiment: z.enum(["SUPPORTIVE", "NEUTRAL", "OPPOSITION"]),
  note: z.string().max(500).optional().nullable(),
});

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) throw new ValidationError("Invalid body", r.error.flatten());
  return r.data;
}

/** Aggregated booth worker dashboard for `GET /booths/me`. */
export async function getMyBoothDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const out = await boothsService.dashboard(req.user!);
    ok(res, out);
  } catch (e) {
    next(e);
  }
}

/** Booth profile + coverage — `GET /booths/:boothLocationId` */
export async function getBoothById(req: Request, res: Response, next: NextFunction) {
  try {
    const boothLocationId = req.params.boothLocationId!;
    const booth = await boothsService.getBoothCard(req.user!, boothLocationId);
    ok(res, { booth });
  } catch (e) {
    next(e);
  }
}

/** Pulse survey mood → `booth_details` — `PATCH /booths/:boothLocationId/mood` */
export async function patchBoothMood(req: Request, res: Response, next: NextFunction) {
  try {
    const boothLocationId = req.params.boothLocationId!;
    const body = parse(moodSchema, req.body);
    const mood = await boothsService.updateMood(req.user!, boothLocationId, body);
    ok(res, { mood });
  } catch (e) {
    next(e);
  }
}
