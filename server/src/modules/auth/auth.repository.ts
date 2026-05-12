import { customAlphabet } from "nanoid";
import type { Prisma } from "@prisma/client";
import type { UserStatus } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { AppError } from "../../lib/errors.js";
import { encryptPhone, hashPhone } from "../../lib/crypto.js";
import { userRepository } from "../users/user.repository.js";

const referralAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genRef = customAlphabet(referralAlphabet, 10);

export class AuthRepository {
  async ensureUniqueReferralCode(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const code = genRef();
      const exists = await userRepository.findByReferralCode(code);
      if (!exists) return code;
    }
    throw new AppError(500, "Could not allocate referral code");
  }

  async createUser(params: {
    fullName: string;
    phone: string;
    email?: string | null;
    passwordHash?: string | null;
    referredById?: string | null;
    roleId?: string | null;
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
  }) {
    const phoneHash = hashPhone(params.phone);
    const phoneEncrypted = encryptPhone(params.phone);
    const referralCode = await this.ensureUniqueReferralCode();

    const user = await userRepository.create({
      fullName: params.fullName,
      phoneEncrypted,
      phoneHash,
      email: params.email ?? undefined,
      passwordHash: params.passwordHash ?? undefined,
      referralCode,
      referredBy: params.referredById
        ? { connect: { id: params.referredById } }
        : undefined,
      role: params.roleId ? { connect: { id: params.roleId } } : undefined,
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
    } as Prisma.UserCreateInput);

    if (params.referredById) {
      await prisma.referral.create({
        data: {
          referrerUserId: params.referredById,
          referredUserId: user.id,
          levelDepth: 1,
        },
      });
      await prisma.user.update({
        where: { id: params.referredById },
        data: { totalReferrals: { increment: 1 } },
      });
    }

    return user;
  }
}

export const authRepository = new AuthRepository();
