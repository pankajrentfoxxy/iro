import { customAlphabet } from "nanoid";
import type { Prisma } from "@prisma/client";
import type { UserStatus } from "@prisma/client";
import { AppError } from "../../lib/errors.js";
import { encryptPhone, hashPhone } from "../../lib/crypto.js";

const referralAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genRef = customAlphabet(referralAlphabet, 10);

const userInclude = {
  role: { select: { id: true, levelCode: true, roleName: true } },
} as const;

export type CreateUserTxParams = {
  fullName: string;
  phone: string;
  email?: string | null;
  passwordHash?: string | null;
  referredById?: string | null;
  roleId?: string | null;
  referralInviteUsedId?: string | null;
  status?: UserStatus;
  dateOfBirth?: Date | null;
  gender?: string | null;
  village?: string | null;
  pincode?: string | null;
  occupation?: string | null;
  education?: string | null;
  stateLabel?: string | null;
  districtLabel?: string | null;
  blockLabel?: string | null;
  stateId?: string | null;
  districtId?: string | null;
  blockId?: string | null;
  boothId?: string | null;
};

export class AuthRepository {
  async ensureUniqueReferralCodeTx(tx: Prisma.TransactionClient): Promise<string> {
    for (let i = 0; i < 12; i++) {
      const code = genRef();
      const exists = await tx.user.findUnique({
        where: { referralCode: code },
        select: { id: true },
      });
      if (!exists) return code;
    }
    throw new AppError(500, "Could not allocate referral code");
  }

  /** Always runs inside an interactive transaction for referral/consistency guarantees. */
  async createUser(tx: Prisma.TransactionClient, params: CreateUserTxParams) {
    const phoneHash = hashPhone(params.phone);
    const phoneEncrypted = encryptPhone(params.phone);
    const referralCode = await this.ensureUniqueReferralCodeTx(tx);

    const user = await tx.user.create({
      data: {
        fullName: params.fullName,
        phoneEncrypted,
        phoneHash,
        email: params.email ?? undefined,
        passwordHash: params.passwordHash ?? undefined,
        referralCode,
        referredBy: params.referredById ? { connect: { id: params.referredById } } : undefined,
        role: params.roleId ? { connect: { id: params.roleId } } : undefined,
        referralInviteUsed: params.referralInviteUsedId
          ? { connect: { id: params.referralInviteUsedId } }
          : undefined,
        status: params.status,
        dateOfBirth: params.dateOfBirth ?? undefined,
        gender: params.gender ?? undefined,
        village: params.village ?? undefined,
        pincode: params.pincode ?? undefined,
        occupation: params.occupation ?? undefined,
        education: params.education ?? undefined,
        stateLabel: params.stateLabel ?? undefined,
        districtLabel: params.districtLabel ?? undefined,
        blockLabel: params.blockLabel ?? undefined,
        state: params.stateId ? { connect: { id: params.stateId } } : undefined,
        district: params.districtId ? { connect: { id: params.districtId } } : undefined,
        block: params.blockId ? { connect: { id: params.blockId } } : undefined,
        booth: params.boothId ? { connect: { id: params.boothId } } : undefined,
      } as Prisma.UserCreateInput,
      include: userInclude,
    });

    if (params.referredById) {
      await tx.referral.create({
        data: {
          referrerUserId: params.referredById,
          referredUserId: user.id,
          levelDepth: 1,
        },
      });
      await tx.user.update({
        where: { id: params.referredById },
        data: { totalReferrals: { increment: 1 } },
      });
      let currentAncestor: string | null = params.referredById;
      while (currentAncestor) {
        const id: string = currentAncestor;
        await tx.user.update({
          where: { id },
          data: { networkSize: { increment: 1 } },
        });
        const uplink: { referredById: string | null } | null = await tx.user.findUnique({
          where: { id },
          select: { referredById: true },
        });
        currentAncestor = uplink?.referredById ?? null;
      }
    }

    return user;
  }
}

export const authRepository = new AuthRepository();
