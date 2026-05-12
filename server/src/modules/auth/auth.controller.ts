import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authService } from "./auth.service.js";
import {
  refreshSchema,
  registerSchema,
  requestOtpSchema,
  updateProfileSchema,
  verifyOtpSchema,
} from "./auth.validation.js";
import { ok } from "../../lib/response.js";
import { ValidationError } from "../../lib/errors.js";

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) throw new ValidationError("Invalid body", r.error.flatten());
  return r.data;
}

export async function postOtpRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parse(requestOtpSchema, req.body);
    const out = await authService.requestOtp(body.phone);
    ok(res, out);
  } catch (e) {
    next(e);
  }
}

export async function postOtpVerify(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parse(verifyOtpSchema, req.body);
    const out = await authService.verifyOtp(body.phone, body.code);
    ok(res, out);
  } catch (e) {
    next(e);
  }
}

export async function postRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parse(registerSchema, req.body);
    const out = await authService.register(body);
    ok(res, out, 201);
  } catch (e) {
    next(e);
  }
}

export async function postRefresh(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parse(refreshSchema, req.body);
    const out = await authService.refresh(body.refreshToken);
    ok(res, out);
  } catch (e) {
    next(e);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const out = await authService.me(userId);
    ok(res, out);
  } catch (e) {
    next(e);
  }
}

export async function patchMe(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parse(updateProfileSchema, req.body);
    const out = await authService.updateProfile(req.user!.id, body);
    ok(res, out);
  } catch (e) {
    next(e);
  }
}
