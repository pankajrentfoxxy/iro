import type { Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "../../config/db.js";
import type { AuthUser } from "../../types/auth.js";

function jurisdictionWhere(viewer: AuthUser): Prisma.UserWhereInput {
  if (!viewer.stateId && !viewer.districtId && !viewer.blockId && !viewer.boothId) {
    return { id: viewer.id };
  }
  if (viewer.boothId) {
    return { OR: [{ id: viewer.id }, { boothId: viewer.boothId }] };
  }
  if (viewer.blockId) return { OR: [{ id: viewer.id }, { blockId: viewer.blockId }] };
  if (viewer.districtId) {
    return { OR: [{ id: viewer.id }, { districtId: viewer.districtId }] };
  }
  if (viewer.stateId) {
    return { OR: [{ id: viewer.id }, { stateId: viewer.stateId }] };
  }
  return {};
}

export class TaskRepository {
  async create(data: Prisma.TaskCreateInput) {
    return prisma.task.create({ data });
  }

  async findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        assignedBy: { select: { id: true, fullName: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });
  }

  async listForViewer(viewer: AuthUser, filters: { status?: TaskStatus }) {
    const assigneeScope = jurisdictionWhere(viewer);
    const assignees = await prisma.user.findMany({
      where: assigneeScope,
      select: { id: true },
    });
    const ids = assignees.map((u) => u.id);

    return prisma.task.findMany({
      where: {
        OR: [{ assignedToId: { in: ids } }, { assignedById: viewer.id }],
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        assignedBy: { select: { id: true, fullName: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });
  }

  async complete(
    id: string,
    proof: { gpsLat?: number | null; gpsLong?: number | null; proofImageUrl?: string | null },
  ) {
    return prisma.task.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        gpsLat: proof.gpsLat ?? undefined,
        gpsLong: proof.gpsLong ?? undefined,
        proofImageUrl: proof.proofImageUrl ?? undefined,
      },
    });
  }
}

export const taskRepository = new TaskRepository();
