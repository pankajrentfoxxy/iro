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

  /** Full downline size via `users.referred_by` (matches referral tree APIs). */
  async networkSizeRaw(rootUserId: string): Promise<number> {
    const rows = await prisma.$queryRaw<{ c: bigint }[]>`
      WITH RECURSIVE sub AS (
        SELECT u.id
        FROM users u
        WHERE u.referred_by::text = ${rootUserId}::text
        UNION
        SELECT u.id
        FROM users u
        INNER JOIN sub s ON u.referred_by::text = s.id::text
      )
      SELECT COUNT(*)::bigint AS c FROM sub;
    `;
    const c = rows[0]?.c ?? 0n;
    return Number(c);
  }
}

export const referralRepository = new ReferralRepository();
