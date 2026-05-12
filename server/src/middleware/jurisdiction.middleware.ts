import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../lib/errors.js";
import { prisma } from "../config/db.js";

/**
 * Ensures target location ids in query/body are within the caller's jurisdiction tree.
 * For production, replace parent-chain walk with materialized path / closure table.
 */
export async function assertLocationInJurisdiction(
  user: NonNullable<Request["user"]>,
  locationId: string,
): Promise<boolean> {
  if (!locationId) return false;
  const loc = await prisma.hierarchyLocation.findUnique({
    where: { id: locationId },
    select: { id: true, parentId: true },
  });
  if (!loc) return false;

  const allowed = new Set<string>();
  if (user.stateId) allowed.add(user.stateId);
  if (user.districtId) allowed.add(user.districtId);
  if (user.blockId) allowed.add(user.blockId);
  if (user.boothId) allowed.add(user.boothId);

  let current: typeof loc | null = loc;
  const visited = new Set<string>();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (allowed.has(current.id)) return true;
    if (!current.parentId) break;
    current = await prisma.hierarchyLocation.findUnique({
      where: { id: current.parentId },
      select: { id: true, parentId: true },
    });
  }

  // National roles: no state assigned → allow all (tighten with explicit country node in production)
  if (!user.stateId && !user.districtId && !user.blockId && !user.boothId) {
    return true;
  }

  return false;
}

export function jurisdictionGuard(paramName: "stateId" | "districtId" | "blockId" | "boothId") {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const raw = req.params[paramName] ?? req.body?.[paramName] ?? req.query[paramName];
    const id = typeof raw === "string" ? raw : undefined;
    if (!id) {
      next();
      return;
    }
    if (!req.user) {
      next(new ForbiddenError());
      return;
    }
    const ok = await assertLocationInJurisdiction(req.user, id);
    if (!ok) {
      next(new ForbiddenError("Outside jurisdiction"));
      return;
    }
    next();
  };
}
