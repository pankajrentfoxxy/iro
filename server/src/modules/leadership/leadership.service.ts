import { prisma } from "../../config/db.js";
import { referralRepository } from "../referrals/referral.repository.js";
import { Decimal } from "@prisma/client/runtime/library";

const W = {
  direct: 1.5,
  network: 1.2,
  tasks: 1.0,
  surveys: 0.8,
  activeDays: 0.5,
  peer: 1.0,
} as const;

export class LeadershipService {
  /** Recalculate scores for a user and persist snapshot + denormalized summary. */
  async recalculateUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { referralsOut: true } } },
    });
    if (!user) return null;

    const directReferrals = user._count.referralsOut;
    const networkSize = await referralRepository.networkSizeRaw(userId);

    const directScore = directReferrals * W.direct * 4;
    const networkScore = Math.log1p(networkSize) * W.network * 10;
    const taskScore = user.tasksCompleted * W.tasks * 3;
    const surveyScore = user.surveysSubmitted * W.surveys * 2;
    const activeDaysScore = user.daysActive * W.activeDays * 0.5;
    const peerScore = Number(user.peerRatingAvg) * 20 * W.peer;

    const final =
      directScore +
      networkScore +
      taskScore +
      surveyScore +
      activeDaysScore +
      peerScore;

    const row = await prisma.leadershipScore.create({
      data: {
        userId,
        directReferralScore: new Decimal(directScore),
        networkScore: new Decimal(networkScore),
        taskScore: new Decimal(taskScore),
        surveyScore: new Decimal(surveyScore),
        activeDaysScore: new Decimal(activeDaysScore),
        peerRatingScore: new Decimal(peerScore),
        finalScore: new Decimal(final),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        leadershipScore: new Decimal(final),
        networkSize,
        totalReferrals: directReferrals,
      },
    });

    return row;
  }
}

export const leadershipService = new LeadershipService();
