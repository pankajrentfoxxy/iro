import { prisma } from "../../config/db.js";
import type { AuthUser } from "../../types/auth.js";

export class AnalyticsService {
  async overview(viewer: AuthUser) {
    const whereState = viewer.stateId ? { stateId: viewer.stateId } : {};

    const [users, surveys, tasksDone, boothLocations] = await Promise.all([
      prisma.user.count({ where: whereState }),
      prisma.survey.count({
        where: { user: whereState },
      }),
      prisma.task.count({
        where: { status: "COMPLETED", assignedTo: whereState },
      }),
      prisma.hierarchyLocation.count({ where: { type: "BOOTH" } }),
    ]);

    const distinctBoothSurveys = await prisma.survey.findMany({
      where: { boothId: { not: null }, user: whereState },
      distinct: ["boothId"],
      select: { boothId: true },
    });

    const last7 = new Date();
    last7.setDate(last7.getDate() - 7);
    const recentSignups = await prisma.user.count({
      where: { ...whereState, createdAt: { gte: last7 } },
    });

    const boothCoveragePct =
      boothLocations > 0 ?
        Math.round((distinctBoothSurveys.filter((b) => b.boothId).length / boothLocations) * 1000) / 10
      : 0;

    return {
      users,
      surveys,
      tasksCompleted: tasksDone,
      boothCoveragePct,
      signupsLast7Days: recentSignups,
    };
  }

  async topInfluencers(viewer: AuthUser, limit = 20) {
    const where = viewer.stateId ? { stateId: viewer.stateId } : {};
    return prisma.user.findMany({
      where,
      orderBy: { leadershipScore: "desc" },
      take: limit,
      select: {
        id: true,
        fullName: true,
        referralCode: true,
        leadershipScore: true,
        networkSize: true,
        stateId: true,
        districtId: true,
      },
    });
  }
}

export const analyticsService = new AnalyticsService();
