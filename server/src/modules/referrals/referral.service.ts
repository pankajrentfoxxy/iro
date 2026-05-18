import { referralRepository } from "./referral.repository.js";
import { prisma } from "../../config/db.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../lib/errors.js";
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

const ROLE_ALIAS_TO_LEVEL: Record<string, string> = {
  president: "L1",
  national_exec: "L2",
  state_leader: "L3",
  regional_leader: "L4",
  district_leader: "L5",
  block_leader: "L6",
  booth_worker: "L7",
  volunteer: "L8",
  reformer: "L8",
};

const LEVEL_ORDER: Record<string, number> = {
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
  L5: 5,
  L6: 6,
  L7: 7,
  L8: 8,
};

export class ReferralService {
  allowedTargetsForCaller(callerCode: string | null | undefined): Set<string> {
    const code = (callerCode ?? "").trim().toUpperCase();
    const rank = LEVEL_ORDER[code] ?? 99;
    if (rank <= 1) return new Set(["L2", "L3", "L4", "L5", "L6", "L7", "L8"]);
    if (rank === 2) return new Set(["L3", "L4", "L5", "L6", "L7", "L8"]);
    if (rank === 3) return new Set(["L4", "L5", "L6", "L7", "L8"]);
    return new Set();
  }

  normalizeRoleLevel(roleKey: string): string {
    const trimmed = roleKey.trim();
    if (/^L\d+$/i.test(trimmed)) {
      const n = trimmed.match(/\d+/i)?.[0];
      return `L${n}`;
    }
    const k = trimmed.toLowerCase();
    const mapped = ROLE_ALIAS_TO_LEVEL[k];
    if (!mapped) throw new ValidationError(`Unknown role: ${roleKey}`);
    return mapped;
  }

  async assignRole(caller: AuthUser, targetUserId: string, roleKey: string) {
    const callerCode = caller.role?.levelCode ?? null;
    const allowed = this.allowedTargetsForCaller(callerCode);
    const targetLevel = this.normalizeRoleLevel(roleKey);
    if (!allowed.has(targetLevel)) {
      throw new ForbiddenError("Cannot assign this role level");
    }

    const roleRow = await prisma.role.findUnique({ where: { levelCode: targetLevel } });
    if (!roleRow) throw new ValidationError("Role not configured");

    const subject = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!subject) throw new NotFoundError("User");

    if (caller.stateId && subject.stateId && subject.stateId !== caller.stateId && callerCode !== "L1" && callerCode !== "L2") {
      throw new ForbiddenError("Target outside your jurisdiction");
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { roleId: roleRow.id },
      include: { role: { select: { id: true, levelCode: true, roleName: true } } },
    });

    await prisma.userNotification.create({
      data: {
        userId: targetUserId,
        type: "ANNOUNCEMENT",
        title: "Role Updated",
        body: `You have been assigned the role: ${roleRow.roleName}`,
        deepLink: "/profile",
      },
    });

    return updated;
  }

  async stats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (!user) throw new NotFoundError("User");

    const directCount = await prisma.user.count({ where: { referredById: userId } });
    const networkCount = await referralRepository.networkSizeRaw(userId);

    await prisma.user.update({
      where: { id: userId },
      data: { totalReferrals: directCount, networkSize: networkCount },
    });

    return {
      directCount,
      networkCount,
      reformerId: user.referralCode,
    };
  }

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
