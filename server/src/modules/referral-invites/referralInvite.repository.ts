import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { ValidationError } from "../../lib/errors.js";

export async function incrementReferralInviteUsesTx(tx: Prisma.TransactionClient, inviteId: string): Promise<void> {
  const result = await tx.$executeRaw(
    Prisma.sql`
      UPDATE referral_invites
      SET used_count = used_count + 1
      WHERE id = ${inviteId}
        AND is_active = true
        AND used_count < max_uses
        AND (expires_at IS NULL OR expires_at > NOW())
    `,
  );
  const n = typeof result === "bigint" ? Number(result) : Number(result);
  if (n !== 1) {
    throw new ValidationError("Invite is no longer valid or has reached its usage limit");
  }
}

export class ReferralInviteRepository {
  async findByCode(code: string, db: Prisma.TransactionClient | PrismaClient = prisma) {
    const normalized = code.trim().toUpperCase();
    return db.referralInvite.findUnique({
      where: { code: normalized },
      include: { targetRole: { select: { id: true, levelCode: true } } },
    });
  }

  async listByCreator(userId: string) {
    return prisma.referralInvite.findMany({
      where: { createdByUserId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        targetRole: { select: { levelCode: true, roleName: true } },
        _count: { select: { usersJoined: true } },
      },
    });
  }

  async create(data: Prisma.ReferralInviteCreateInput) {
    return prisma.referralInvite.create({
      data,
      include: {
        targetRole: { select: { levelCode: true, roleName: true } },
      },
    });
  }
}

export const referralInviteRepository = new ReferralInviteRepository();
