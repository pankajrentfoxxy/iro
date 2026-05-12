import { prisma } from "../../config/db.js";

export class ReferralRepository {
  async findInvitees(userId: string) {
    return prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        fullName: true,
        referralCode: true,
        totalReferrals: true,
        networkSize: true,
        leadershipScore: true,
        createdAt: true,
      },
    });
  }

  async networkSizeRaw(rootUserId: string): Promise<number> {
    const rows = await prisma.$queryRaw<{ c: bigint }[]>`
      WITH RECURSIVE sub AS (
        SELECT r.referred_user_id AS id
        FROM referrals r
        WHERE r.referrer_user_id = ${rootUserId}::uuid
        UNION
        SELECT r.referred_user_id
        FROM referrals r
        INNER JOIN sub s ON r.referrer_user_id = s.id
      )
      SELECT COUNT(*)::bigint AS c FROM sub;
    `;
    const c = rows[0]?.c ?? 0n;
    return Number(c);
  }
}

export const referralRepository = new ReferralRepository();
