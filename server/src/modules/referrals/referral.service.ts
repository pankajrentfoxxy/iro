import { referralRepository } from "./referral.repository.js";
import { prisma } from "../../config/db.js";
import { ForbiddenError } from "../../lib/errors.js";
import type { AuthUser } from "../../types/auth.js";

export type ReferralTreeNode = {
  id: string;
  fullName: string;
  referralCode: string;
  totalReferrals: number;
  networkSize: number;
  leadershipScore: number;
  children: ReferralTreeNode[];
};

export class ReferralService {
  async treeForUser(userId: string, maxDepth: number, viewer: AuthUser): Promise<ReferralTreeNode | null> {
    if (viewer.id !== userId) {
      throw new ForbiddenError("Cannot read another user's referral tree");
    }
    return this.buildSubtree(userId, maxDepth);
  }

  private async buildSubtree(userId: string, depth: number): Promise<ReferralTreeNode | null> {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        referralCode: true,
        totalReferrals: true,
        networkSize: true,
        leadershipScore: true,
      },
    });
    if (!u) return null;

    if (depth <= 0) {
      return {
        ...u,
        leadershipScore: Number(u.leadershipScore),
        children: [],
      };
    }

    const kids = await referralRepository.findInvitees(userId);
    const children = (
      await Promise.all(kids.map((k) => this.buildSubtree(k.id, depth - 1)))
    ).filter((n): n is ReferralTreeNode => n !== null);

    return {
      ...u,
      leadershipScore: Number(u.leadershipScore),
      children,
    };
  }

  async leaderboard(viewer: AuthUser, limit = 50) {
    const where = viewer.stateId ? { stateId: viewer.stateId } : {};

    const rows = await prisma.user.findMany({
      where,
      orderBy: [{ networkSize: "desc" }, { totalReferrals: "desc" }],
      take: limit,
      select: {
        id: true,
        fullName: true,
        referralCode: true,
        totalReferrals: true,
        networkSize: true,
        leadershipScore: true,
        districtId: true,
        stateId: true,
      },
    });

    return rows.map((r, idx) => ({
      rank: idx + 1,
      ...r,
      leadershipScore: Number(r.leadershipScore),
    }));
  }

  async syncNetworkSize(userId: string) {
    const size = await referralRepository.networkSizeRaw(userId);
    await prisma.user.update({
      where: { id: userId },
      data: { networkSize: size },
    });
    return size;
  }
}

export const referralService = new ReferralService();
