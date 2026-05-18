import type { Prisma } from "@prisma/client";
import { customAlphabet } from "nanoid";
import { prisma } from "../../config/db.js";
import { AppError, ForbiddenError } from "../../lib/errors.js";
import { getRedis } from "../../config/redis.js";
import {
  canInviteTargetLevel,
  getAllowedReferralLevels,
  normalizeLevelCode,
} from "../../lib/roleHierarchy.js";
import type { AuthUser } from "../../types/auth.js";
import { referralInviteRepository } from "./referralInvite.repository.js";
import type { CreateReferralInviteInput } from "./referralInvite.validation.js";

const suffixAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genSuffix = customAlphabet(suffixAlphabet, 6);

async function allocateInviteCode(targetLevel: string): Promise<string> {
  const prefix = normalizeLevelCode(targetLevel);
  for (let i = 0; i < 16; i++) {
    const code = `${prefix}-${genSuffix()}`;
    const [inviteHit, userHit] = await Promise.all([
      prisma.referralInvite.findUnique({ where: { code }, select: { id: true } }),
      prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } }),
    ]);
    if (!inviteHit && !userHit) return code;
  }
  throw new AppError(500, "Could not allocate invite code");
}

function publishRedis(eventType: string, data: Record<string, unknown>) {
  try {
    const redis = getRedis();
    void redis.publish("iro:events", JSON.stringify({ type: eventType, data }));
  } catch {
    /* ignore */
  }
}

export class ReferralInviteService {
  allowedTargets(viewer: AuthUser): string[] {
    const code = viewer.role?.levelCode ?? "";
    return getAllowedReferralLevels(code);
  }

  async createInvite(viewer: AuthUser, input: CreateReferralInviteInput, audit?: { ip?: string | null }) {
    const inviterCode = viewer.role?.levelCode ?? "";
    const target = normalizeLevelCode(input.targetRoleLevel);
    if (!target) throw new ForbiddenError("Invalid target role");

    if (!canInviteTargetLevel(inviterCode, target)) {
      throw new ForbiddenError("You cannot create invites for this role level");
    }

    const roleRow = await prisma.role.findUnique({ where: { levelCode: target } });
    if (!roleRow) throw new AppError(500, "Role configuration missing");

    const code = await allocateInviteCode(target);
    const expiresAt =
      input.expiresAt && input.expiresAt.length > 0 ? new Date(input.expiresAt) : null;

    const invite = await referralInviteRepository.create({
      code,
      maxUses: input.maxUses ?? 1,
      expiresAt,
      creator: { connect: { id: viewer.id } },
      targetRole: { connect: { id: roleRow.id } },
    });

    await prisma.auditLog.create({
      data: {
        userId: viewer.id,
        method: "POST",
        path: "/referral-invites",
        statusCode: 201,
        ip: audit?.ip ?? null,
        metadata: {
          inviteId: invite.id,
          code: invite.code,
          targetRoleLevel: target,
          maxUses: invite.maxUses,
        } as Prisma.InputJsonValue,
      },
    });

    publishRedis("referral_invite_created", {
      inviteId: invite.id,
      creatorUserId: viewer.id,
      targetRole: target,
      code: invite.code,
    });

    return {
      code: invite.code,
      targetRole: target,
      maxUses: invite.maxUses,
      expiresAt: invite.expiresAt,
      id: invite.id,
    };
  }

  async listMine(viewer: AuthUser) {
    const rows = await referralInviteRepository.listByCreator(viewer.id);
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      targetRole: r.targetRole.levelCode,
      targetRoleName: r.targetRole.roleName,
      maxUses: r.maxUses,
      usedCount: r.usedCount,
      remainingUses: Math.max(0, r.maxUses - r.usedCount),
      isActive: r.isActive,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      joinedViaInviteCount: r._count.usersJoined,
    }));
  }

  async myNetwork(viewer: AuthUser) {
    const invites = await referralInviteRepository.listByCreator(viewer.id);

    const totalInvites = invites.length;
    const usedInvites = invites.filter((i) => i.usedCount > 0).length;
    const pendingInvites = invites.filter((i) => i.isActive && i.usedCount < i.maxUses).length;
    const exhaustedInvites = invites.filter((i) => i.usedCount >= i.maxUses || !i.isActive).length;

    const directDownline = await prisma.user.findMany({
      where: { referredById: viewer.id },
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        referralInviteUsedId: true,
        role: { select: { levelCode: true, roleName: true } },
        referralInviteUsed: {
          select: {
            id: true,
            code: true,
            targetRole: { select: { levelCode: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const joinedByRoleLevel: Record<string, number> = {};
    for (const u of directDownline) {
      const key = u.role?.levelCode ?? "UNKNOWN";
      joinedByRoleLevel[key] = (joinedByRoleLevel[key] ?? 0) + 1;
    }

    return {
      summary: {
        totalInvites,
        usedInvites,
        pendingInvites,
        exhaustedInvites,
        directJoinCount: directDownline.length,
      },
      invites: invites.map((r) => ({
        id: r.id,
        code: r.code,
        targetRole: r.targetRole.levelCode,
        maxUses: r.maxUses,
        usedCount: r.usedCount,
        remainingUses: Math.max(0, r.maxUses - r.usedCount),
        isActive: r.isActive,
        expiresAt: r.expiresAt,
      })),
      directDownline: directDownline.map((u) => ({
        userId: u.id,
        fullName: u.fullName,
        joinedAt: u.createdAt,
        assignedRole: u.role?.levelCode ?? null,
        assignedRoleName: u.role?.roleName ?? null,
        joinedViaInviteCode: u.referralInviteUsed?.code ?? null,
        inviteTargetRole: u.referralInviteUsed?.targetRole.levelCode ?? null,
      })),
      joinedByRoleLevel,
    };
  }
}

export const referralInviteService = new ReferralInviteService();
