import type { Prisma } from "@prisma/client";
import { ValidationError } from "../../lib/errors.js";
import { referralInviteRepository } from "./referralInvite.repository.js";

export type ResolvedRegistrationReferral = {
  referredById: string | null;
  roleId: string | null;
  referralInviteUsedId: string | null;
  targetRoleLevel: string | null;
};

/**
 * Resolve invite-first referral codes (hierarchical invites), then legacy `users.referral_code`,
 * then default volunteer signup when code omitted.
 */
export async function resolveRegistrationReferral(
  tx: Prisma.TransactionClient,
  rawCode: string | null | undefined,
): Promise<ResolvedRegistrationReferral> {
  const volunteer = await tx.role.findUnique({
    where: { levelCode: "L8" },
    select: { id: true },
  });

  const trimmed = rawCode?.trim();
  if (!trimmed) {
    return {
      referredById: null,
      roleId: volunteer?.id ?? null,
      referralInviteUsedId: null,
      targetRoleLevel: null,
    };
  }

  const normalized = trimmed.toUpperCase();

  const invite = await referralInviteRepository.findByCode(normalized, tx);
  if (invite) {
    if (!invite.isActive) throw new ValidationError("Invite is not active");
    if (invite.usedCount >= invite.maxUses) throw new ValidationError("Invite usage limit reached");
    if (invite.expiresAt && invite.expiresAt <= new Date()) throw new ValidationError("Invite has expired");

    return {
      referredById: invite.createdByUserId,
      roleId: invite.createdForRoleId,
      referralInviteUsedId: invite.id,
      targetRoleLevel: invite.targetRole.levelCode,
    };
  }

  const legacy = await tx.user.findUnique({
    where: { referralCode: normalized },
    select: { id: true },
  });
  if (legacy) {
    return {
      referredById: legacy.id,
      roleId: volunteer?.id ?? null,
      referralInviteUsedId: null,
      targetRoleLevel: "L8",
    };
  }

  throw new ValidationError("Invalid referral code");
}
