import type { Request, Response } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { ValidationError } from "../../lib/errors.js";
import * as svc from "./auth.service.js";

const loginSchema = z
  .object({
    /** Preferred: phone number or email */
    identifier: z.string().min(3).optional(),
    /** @deprecated use `identifier`; still accepted for older clients */
    phone: z.string().min(3).optional(),
    password: z.string().min(6),
  })
  .superRefine((val, ctx) => {
    const id = val.identifier ?? val.phone;
    if (!id?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "identifier or phone is required" });
    }
  });

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export async function postLogin(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError("Invalid body", parsed.error.flatten());
  const identifier = (parsed.data.identifier ?? parsed.data.phone ?? "").trim();
  const out = await svc.loginService({
    identifier,
    password: parsed.data.password,
    ip: req.ip,
    userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : null,
  });
  return ok(res, out);
}

export async function postRefresh(req: Request, res: Response) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError("Invalid body", parsed.error.flatten());
  const out = await svc.refreshService(parsed.data.refreshToken);
  return ok(res, out);
}

export async function postLogout(req: Request, res: Response) {
  const parsed = refreshSchema.partial().safeParse(req.body);
  const rt = parsed.success ? parsed.data.refreshToken : undefined;
  const out = await svc.logoutService(rt);
  return ok(res, out);
}

export async function getMe(req: Request, res: Response) {
  const out = await svc.meService(req.user!.id);
  return ok(res, out);
}
