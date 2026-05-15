import type { HierarchyType, SurveySentiment } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { ForbiddenError, NotFoundError } from "../../lib/errors.js";
import type { AuthUser } from "../../types/auth.js";
import { taskRepository } from "../tasks/task.repository.js";

const INACTIVE_MS = 7 * 24 * 60 * 60 * 1000;

async function hierarchyAreaLabel(boothLocationId: string): Promise<string> {
  const parts: string[] = [];
  let id: string | null = boothLocationId;
  while (id) {
    const row: { name: string; parentId: string | null; type: HierarchyType } | null =
      await prisma.hierarchyLocation.findUnique({
        where: { id },
        select: { name: true, parentId: true, type: true },
      });
    if (!row) break;
    if (row.type !== "COUNTRY") parts.unshift(row.name);
    id = row.parentId;
  }
  return parts.join(" • ");
}

export class BoothsService {
  assertOwnBooth(viewer: AuthUser, boothLocationId: string) {
    if (!viewer.boothId || viewer.boothId !== boothLocationId) {
      throw new ForbiddenError("Not assigned to this booth");
    }
  }

  async getBoothCard(viewer: AuthUser, boothLocationId: string) {
    this.assertOwnBooth(viewer, boothLocationId);

    const booth = await prisma.hierarchyLocation.findFirst({
      where: { id: boothLocationId, type: "BOOTH" },
      include: { boothDetail: true },
    });
    if (!booth) throw new NotFoundError("Booth");

    const detail = booth.boothDetail;
    const registeredVoters = detail?.registeredVoters ?? 900;
    const boothNumber = detail?.boothNumber ?? booth.name;

    const reformerCount = await prisma.user.count({
      where: { boothId: boothLocationId },
    });

    const coveragePercent =
      registeredVoters > 0 ?
        Math.min(100, Math.round((reformerCount / registeredVoters) * 100))
      : 0;

    const area = await hierarchyAreaLabel(boothLocationId);

    return {
      id: booth.id,
      boothNumber,
      area,
      registeredVoters,
      reformerCount,
      coveragePercent,
      mood:
        detail?.lastMoodSentiment ?
          {
            sentiment: detail.lastMoodSentiment,
            note: detail.lastMoodNote,
            at: detail.lastMoodAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  async listBoothReformers(viewer: AuthUser, boothLocationId: string) {
    this.assertOwnBooth(viewer, boothLocationId);

    const rows = await prisma.user.findMany({
      where: { boothId: boothLocationId },
      select: {
        id: true,
        fullName: true,
        referralCode: true,
        updatedAt: true,
        role: { select: { levelCode: true, roleName: true } },
      },
      orderBy: { fullName: "asc" },
      take: 500,
    });

    const now = Date.now();
    return rows.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      referralCode: u.referralCode,
      roleLevel: u.role?.levelCode ?? null,
      roleName: u.role?.roleName ?? null,
      lastActiveAt: u.updatedAt.toISOString(),
      inactiveAlert: now - u.updatedAt.getTime() > INACTIVE_MS,
    }));
  }

  async tasksDueToday(viewer: AuthUser) {
    return taskRepository.listForViewer(viewer, {
      assignedToMeOnly: true,
      dueToday: true,
    });
  }

  async dashboard(viewer: AuthUser) {
    if (!viewer.boothId) {
      throw new ForbiddenError("No booth assigned to your profile");
    }
    const boothId = viewer.boothId;
    const [boothCard, reformers, tasksDueToday] = await Promise.all([
      this.getBoothCard(viewer, boothId),
      this.listBoothReformers(viewer, boothId),
      this.tasksDueToday(viewer),
    ]);

    return {
      booth: boothCard,
      reformers,
      tasksDueToday,
      inactiveCount: reformers.filter((r) => r.inactiveAlert).length,
    };
  }

  async updateMood(
    viewer: AuthUser,
    boothLocationId: string,
    input: { sentiment: SurveySentiment; note?: string | null },
  ) {
    this.assertOwnBooth(viewer, boothLocationId);

    await prisma.boothDetail.upsert({
      where: { boothLocationId },
      create: {
        boothLocationId,
        lastMoodSentiment: input.sentiment,
        lastMoodNote: input.note ?? null,
        lastMoodAt: new Date(),
        lastMoodByUserId: viewer.id,
      },
      update: {
        lastMoodSentiment: input.sentiment,
        lastMoodNote: input.note ?? null,
        lastMoodAt: new Date(),
        lastMoodByUserId: viewer.id,
      },
    });

    const row = await prisma.boothDetail.findUnique({
      where: { boothLocationId },
    });
    return {
      sentiment: row!.lastMoodSentiment,
      note: row!.lastMoodNote,
      at: row!.lastMoodAt!.toISOString(),
    };
  }
}

export const boothsService = new BoothsService();
