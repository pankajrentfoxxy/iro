import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/db.js";
import { NotFoundError } from "../../lib/errors.js";
import { ok } from "../../lib/response.js";
import { referralRepository } from "../referrals/referral.repository.js";

function mapPersonaRole(levelCode: string | null | undefined): string {
  if (!levelCode) return "volunteer";
  const code = levelCode.trim().toUpperCase().replace(/^L/i, "L");
  const n = Number(code.replace("L", ""));
  if (n <= 1) return "president";
  if (n === 2) return "national_exec";
  if (n === 3) return "state_leader";
  if (n === 4) return "district_leader";
  if (n === 5) return "block_leader";
  if (n === 6) return "booth_worker";
  return "volunteer";
}

/** GET /users/live-count — public live reformer total */
export async function getLiveCount(_req: Request, res: Response, next: NextFunction) {
  try {
    const count = await prisma.user.count({ where: { status: "ACTIVE" } });
    ok(res, { count });
  } catch (e) {
    next(e);
  }
}

/** GET /users/me/stats — dashboard aggregates */
export async function getMeStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const [user, latestLeadership, tasksDone, questionnaireDone] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          referralCode: true,
          profileImage: true,
          totalReferrals: true,
          networkSize: true,
          leadershipScore: true,
          peerRatingAvg: true,
          tasksCompleted: true,
          surveysSubmitted: true,
          daysActive: true,
          stateId: true,
          districtId: true,
          blockId: true,
          role: { select: { levelCode: true, roleName: true } },
        },
      }),
      prisma.leadershipScore.findFirst({
        where: { userId },
        orderBy: { calculatedAt: "desc" },
      }),
      prisma.task.count({ where: { assignedToId: userId, status: "COMPLETED" } }),
      prisma.questionnaireResponse.count({ where: { userId } }),
    ]);

    if (!user) {
      next(new NotFoundError("User"));
      return;
    }

    const liveNetwork = await referralRepository.networkSizeRaw(userId);
    const direct = await prisma.user.count({ where: { referredById: userId } });

    const activityScore = Math.min(
      100,
      user.daysActive * 2 + user.tasksCompleted * 5 + user.surveysSubmitted * 3,
    );

    const totalXP =
      user.tasksCompleted * 100 +
      user.surveysSubmitted * 75 +
      questionnaireDone * 75 +
      user.daysActive * 10 +
      (latestLeadership ? Number(latestLeadership.finalScore) * 10 : 0);

    ok(res, {
      user: {
        id: user.id,
        name: user.fullName,
        role: mapPersonaRole(user.role?.levelCode ?? null),
        roleLevelCode: user.role?.levelCode ?? null,
        roleName: user.role?.roleName ?? null,
        stateId: user.stateId,
        districtId: user.districtId,
        blockId: user.blockId,
        directCount: direct,
        networkCount: Math.max(user.networkSize, liveNetwork),
        reformerId: user.referralCode,
        profilePhotoUrl: user.profileImage,
      },
      xp: {
        totalXP: Math.round(totalXP),
        level: Math.max(1, Math.floor(totalXP / 2000) + 1),
        streak: user.daysActive,
        activityScore,
        surveyScore: Number(user.peerRatingAvg),
        leadershipScore: Number(user.leadershipScore),
      },
      badgeCount: questionnaireDone,
      tasksCompleted: tasksDone,
      surveysSubmitted: user.surveysSubmitted + questionnaireDone,
    });
  } catch (e) {
    next(e);
  }
}
