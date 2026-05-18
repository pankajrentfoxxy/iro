import type { Request, Response } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { ValidationError } from "../../lib/errors.js";
import type { UserStatus } from "@prisma/client";
import * as svc from "./adminUsers.service.js";

const listQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
  search: z.string().optional(),
  roleLevel: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  sort: z.enum(["createdAt", "fullName"]).optional(),
  dir: z.enum(["asc", "desc"]).optional(),
});

const patchProfile = z.object({
  fullName: z.string().min(1).optional(),
  village: z.string().optional(),
  pincode: z.string().optional(),
  occupation: z.string().optional(),
  education: z.string().optional(),
});

const patchStatus = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export async function getUsers(req: Request, res: Response) {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) throw new ValidationError("Invalid query", parsed.error.flatten());
  const data = await svc.listUsers(req.user!, parsed.data);
  return ok(res, data);
}

export async function getUser(req: Request, res: Response) {
  const data = await svc.getUserDetail(req.user!, req.params.id as string);
  return ok(res, data);
}

export async function patchUser(req: Request, res: Response) {
  const parsed = patchProfile.safeParse(req.body);
  if (!parsed.success) throw new ValidationError("Invalid body", parsed.error.flatten());
  const data = await svc.patchUserProfile(req.user!, req.params.id as string, parsed.data);
  return ok(res, data);
}

export async function patchStatusHandler(req: Request, res: Response) {
  const parsed = patchStatus.safeParse(req.body);
  if (!parsed.success) throw new ValidationError("Invalid body", parsed.error.flatten());
  const data = await svc.patchUserStatus(req.user!, req.params.id as string, parsed.data.status as UserStatus);
  return ok(res, data);
}

export async function getNetwork(req: Request, res: Response) {
  const depth = req.query.depth ? Number(req.query.depth) : 4;
  const data = await svc.userNetworkTree(req.user!, req.params.id as string, Math.min(8, depth || 4));
  return ok(res, data);
}

export async function getReferrals(req: Request, res: Response) {
  const data = await svc.userReferralFlat(req.user!, req.params.id as string);
  return ok(res, data);
}
