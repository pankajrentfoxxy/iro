import type { Prisma } from "@prisma/client";
import type { AdminAuthUser } from "../types/auth.js";
import { levelRank } from "./rbac.js";

/** Scope Prisma `User` queries to the administrator's jurisdiction */
export function jurisdictionUserWhere(viewer: AdminAuthUser): Prisma.UserWhereInput {
  const code = viewer.role?.levelCode ?? "";
  const r = levelRank(code);

  if (r <= 2) return {};
  if (r === 3 && viewer.stateId) return { stateId: viewer.stateId };
  if (r === 4 && viewer.districtId) return { districtId: viewer.districtId };
  if (r === 5 && viewer.blockId) return { blockId: viewer.blockId };
  if (r === 6 && viewer.boothId) return { boothId: viewer.boothId };

  return { id: { in: [] } };
}

export function jurisdictionHierarchyWhere(viewer: AdminAuthUser): Prisma.HierarchyLocationWhereInput {
  const code = viewer.role?.levelCode ?? "";
  const r = levelRank(code);
  if (r <= 2) return {};
  if (r === 3 && viewer.stateId) return { OR: [{ id: viewer.stateId }, { parentId: viewer.stateId }] };
  if (r === 4 && viewer.districtId) {
    return { OR: [{ id: viewer.districtId }, { parentId: viewer.districtId }] };
  }
  if (r === 5 && viewer.blockId) return { OR: [{ id: viewer.blockId }, { parentId: viewer.blockId }] };
  if (r === 6 && viewer.boothId) return { id: viewer.boothId };
  return { id: { in: [] } };
}
