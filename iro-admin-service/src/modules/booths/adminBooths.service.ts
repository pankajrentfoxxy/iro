/**
 * Admin-only booth assignment. Mobile booth dashboard (`GET /booths/me`, mood, tasks) stays on the main IRO API.
 */
import { prisma } from "../../config/db.js";
import { ForbiddenError, NotFoundError } from "../../lib/errors.js";
import { jurisdictionHierarchyWhere } from "../../lib/jurisdiction.js";
import type { AdminAuthUser } from "../../types/auth.js";
import { assertUserInScope } from "../users/adminUsers.service.js";

export async function assignBoothWorker(viewer: AdminAuthUser, boothId: string, userId: string) {
  const booth = await prisma.hierarchyLocation.findFirst({
    where: { id: boothId, type: "BOOTH", AND: [jurisdictionHierarchyWhere(viewer)] },
  });
  if (!booth) throw new ForbiddenError("Invalid booth or outside your jurisdiction");

  await assertUserInScope(viewer, userId);
  return prisma.user.update({
    where: { id: userId },
    data: { boothId },
    include: { role: true, booth: { select: { id: true, name: true } } },
  });
}

export async function unassignBoothWorker(viewer: AdminAuthUser, userId: string) {
  await assertUserInScope(viewer, userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, boothId: true },
  });
  if (!user) throw new NotFoundError("User");

  if (user.boothId) {
    const booth = await prisma.hierarchyLocation.findFirst({
      where: { id: user.boothId, type: "BOOTH", AND: [jurisdictionHierarchyWhere(viewer)] },
    });
    if (!booth) throw new ForbiddenError("Cannot modify booth assignment outside your jurisdiction");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { boothId: null },
    include: { role: true, booth: { select: { id: true, name: true } } },
  });
}
