import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { getRedis } from "../../config/redis.js";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ForbiddenError,
} from "../../lib/errors.js";
import {
  signAccessToken,
  signRefreshToken,
  signRegisterToken,
  verifyRegisterToken,
  verifyRefreshToken,
} from "../../lib/jwt.js";
import {
  clearStoredOtp,
  // generateOtp,
  getStoredOtp,
  storeOtp,
} from "../../lib/otp.js";
import { hashPhone } from "../../lib/crypto.js";
import { logger } from "../../lib/logger.js";
import { env } from "../../config/env.js";
import { authRepository } from "./auth.repository.js";
import { referralRepository } from "../referrals/referral.repository.js";
import { userRepository } from "../users/user.repository.js";
import type { RegisterInput, UpdateProfileInput } from "./auth.validation.js";

const userInclude = {
  role: { select: { id: true, levelCode: true, roleName: true } },
} as const;

/** DB row includes profile columns; widen until `prisma generate` matches schema. */
type UserRow = NonNullable<Awaited<ReturnType<typeof userRepository.findById>>> & {
  dateOfBirth?: Date | null;
  gender?: string | null;
  village?: string | null;
  pincode?: string | null;
  occupation?: string | null;
  education?: string | null;
  stateLabel?: string | null;
  districtLabel?: string | null;
  blockLabel?: string | null;
};

export type ReferralTreeNodeDto = {
  id: string;
  name: string;
  role: string;
  children?: ReferralTreeNodeDto[];
};

function refreshKey(jti: string) {
  return `refresh:${jti}`;
}

type LiveReferralStats = { totalReferrals: number; networkSize: number };

export class AuthService {
  private async resolveJurisdictionFromLabels(input: {
    stateName: string;
    districtName: string;
    blockName: string;
  }): Promise<{ stateId: string | null; districtId: string | null; blockId: string | null }> {
    const state = await prisma.hierarchyLocation.findFirst({
      where: { type: "STATE", name: input.stateName },
    });
    if (!state) return { stateId: null, districtId: null, blockId: null };

    const district = await prisma.hierarchyLocation.findFirst({
      where: {
        type: "DISTRICT",
        name: input.districtName,
        parentId: state.id,
      },
    });
    if (!district) return { stateId: state.id, districtId: null, blockId: null };

    const block = await prisma.hierarchyLocation.findFirst({
      where: {
        type: "BLOCK",
        name: input.blockName,
        parentId: district.id,
      },
    });
    return {
      stateId: state.id,
      districtId: district.id,
      blockId: block?.id ?? null,
    };
  }

  async requestOtp(phone: string) {
    const redis = getRedis();
    // const code = generateOtp();
    const code = "123456";
    console.log("code", code);
    await storeOtp(redis, phone, code);
    if (env.NODE_ENV === "development") {
      logger.info(`OTP for ${phone}: ${code}`);
    }
    const { smsQueue } = await import("../../config/queues.js");
    await smsQueue.add(
      "otp",
      { phone, message: `Your IRO verification code is ${code}` },
      { removeOnComplete: true },
    );
    return { sent: true, expiresIn: env.OTP_EXPIRY_SECONDS, code };
  }

  async verifyOtp(phone: string, code: string) {
    const redis = getRedis();
    const stored = await getStoredOtp(redis, phone);
    if (!stored || stored !== code) throw new UnauthorizedError("Invalid or expired OTP");

    const phoneHash = hashPhone(phone);
    const user = await userRepository.findByPhoneHash(phoneHash);

    await clearStoredOtp(redis, phone);

    if (user) {
      if (user.status !== "ACTIVE") throw new ForbiddenError("Account not active");
      const tokens = await this.issueTokens(user.id);
      const live = await this.liveReferralStats(user.id);
      return {
        needsRegistration: false as const,
        user: this.publicUser(user as UserRow, live),
        ...tokens,
      };
    }

    const registerToken = signRegisterToken(phoneHash);
    return { needsRegistration: true as const, registerToken };
  }

  async register(input: RegisterInput) {
    let payload;
    try {
      payload = verifyRegisterToken(input.registerToken);
    } catch {
      throw new UnauthorizedError("Invalid registration token");
    }

    if (hashPhone(input.phone) !== payload.phoneHash) {
      throw new ValidationError("Phone does not match OTP verification");
    }

    const existing = await userRepository.findByPhoneHash(payload.phoneHash);
    if (existing) throw new ValidationError("User already registered");

    let referredById: string | null = null;
    if (input.referralCode) {
      const ref = await userRepository.findByReferralCode(input.referralCode);
      if (!ref) throw new ValidationError("Invalid referral code");
      referredById = ref.id;
    }

    const volunteer = await prisma.role.findUnique({ where: { levelCode: "L8" } });
    const passwordHash =
      input.password && input.password.length > 0
        ? await bcrypt.hash(input.password, 12)
        : null;

    const [y, m, d] = input.dob.split("-").map(Number);
    const dateOfBirth = new Date(Date.UTC(y, m - 1, d));

    const resolved = await this.resolveJurisdictionFromLabels({
      stateName: input.stateName,
      districtName: input.districtName,
      blockName: input.blockName,
    });

    const stateId = input.stateId ?? resolved.stateId;
    const districtId = input.districtId ?? resolved.districtId;
    const blockId = input.blockId ?? resolved.blockId;

    const user = await authRepository.createUser({
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      passwordHash,
      referredById,
      roleId: volunteer?.id ?? null,
      dateOfBirth,
      gender: input.gender,
      village: input.village.trim(),
      pincode: input.pincode,
      occupation: input.occupation,
      education: input.education,
      stateLabel: input.stateName,
      districtLabel: input.districtName,
      blockLabel: input.blockName,
      stateId,
      districtId,
      blockId,
      boothId: input.boothId ?? null,
    });

    const tokens = await this.issueTokens(user.id);
    const live = await this.liveReferralStats(user.id);
    return { user: this.publicUser(user as UserRow, live), ...tokens };
  }

  async issueTokens(userId: string) {
    const redis = getRedis();
    const jti = uuidv4();
    await redis.set(refreshKey(jti), userId, "EX", env.REFRESH_TTL_SECONDS);
    return {
      accessToken: signAccessToken(userId),
      refreshToken: signRefreshToken(userId, jti),
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    };
  }

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError("Invalid refresh token");
    }
    const redis = getRedis();
    const userId = await redis.get(refreshKey(payload.jti));
    if (!userId || userId !== payload.sub) {
      throw new UnauthorizedError("Refresh token revoked or expired");
    }
    await redis.del(refreshKey(payload.jti));
    return this.issueTokens(userId);
  }

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User");
    const live = await this.liveReferralStats(userId);
    return this.publicUser(user as UserRow, live);
  }

  async myReferralTree(userId: string): Promise<{ tree: ReferralTreeNodeDto }> {
    const flat = await userRepository.buildReferralSubtree(userId);
    if (!flat) throw new NotFoundError("User");

    const roleLabel = (code: string | null) => {
      if (!code) return "L8";
      const m = code.trim().toUpperCase().match(/L?(\d+)/);
      if (!m) return "L8";
      return `L${m[1]}`;
    };

    const toNode = (id: string): ReferralTreeNodeDto => {
      const meta = flat.nodes.get(id);
      const childIds = flat.childrenByParent.get(id) ?? [];
      const children = childIds.map(toNode);
      return {
        id,
        name: meta?.fullName ?? "",
        role: roleLabel(meta?.levelCode ?? null),
        ...(children.length ? { children } : {}),
      };
    };

    return { tree: toNode(flat.rootId) };
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const existingRaw = await userRepository.findById(userId);
    if (!existingRaw) throw new NotFoundError("User");
    const existing = existingRaw as UserRow;

    const data: Record<string, unknown> = {};

    if (input.fullName !== undefined) data.fullName = input.fullName;
    if (input.gender !== undefined) data.gender = input.gender;
    if (input.village !== undefined) data.village = input.village.trim();
    if (input.pincode !== undefined) data.pincode = input.pincode;
    if (input.occupation !== undefined) data.occupation = input.occupation;
    if (input.education !== undefined) data.education = input.education;
    if (input.stateName !== undefined) data.stateLabel = input.stateName;
    if (input.districtName !== undefined) data.districtLabel = input.districtName;
    if (input.blockName !== undefined) data.blockLabel = input.blockName;
    if (input.dob !== undefined) {
      const [y, m, d] = input.dob.split("-").map(Number);
      data.dateOfBirth = new Date(Date.UTC(y, m - 1, d));
    }

    const locEdited =
      input.stateName !== undefined ||
      input.districtName !== undefined ||
      input.blockName !== undefined;

    if (locEdited) {
      const stateName = input.stateName ?? existing.stateLabel ?? "";
      const districtName = input.districtName ?? existing.districtLabel ?? "";
      const blockName = input.blockName ?? existing.blockLabel ?? "";
      if (stateName && districtName && blockName) {
        const r = await this.resolveJurisdictionFromLabels({
          stateName,
          districtName,
          blockName,
        });
        data.stateId = r.stateId;
        data.districtId = r.districtId;
        data.blockId = r.blockId;
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: data as Prisma.UserUncheckedUpdateInput,
      include: userInclude,
    });
    const live = await this.liveReferralStats(userId);
    return this.publicUser(updated as UserRow, live);
  }

  private async liveReferralStats(userId: string): Promise<LiveReferralStats> {
    const [networkSize, totalReferrals] = await Promise.all([
      referralRepository.networkSizeRaw(userId),
      prisma.user.count({ where: { referredById: userId } }),
    ]);
    return { networkSize, totalReferrals };
  }

  private publicUser(user: UserRow, live?: LiveReferralStats) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      referralCode: user.referralCode,
      role: user.role,
      profile: {
        dob: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : null,
        gender: user.gender ?? null,
        village: user.village ?? null,
        pincode: user.pincode ?? null,
        occupation: user.occupation ?? null,
        education: user.education ?? null,
        stateName: user.stateLabel ?? null,
        districtName: user.districtLabel ?? null,
        blockName: user.blockLabel ?? null,
      },
      jurisdiction: {
        stateId: user.stateId,
        districtId: user.districtId,
        blockId: user.blockId,
        boothId: user.boothId,
      },
      stats: {
        leadershipScore: user.leadershipScore,
        peerRatingAvg: user.peerRatingAvg,
        totalReferrals: live?.totalReferrals ?? user.totalReferrals,
        networkSize: live?.networkSize ?? user.networkSize,
        tasksCompleted: user.tasksCompleted,
        surveysSubmitted: user.surveysSubmitted,
        daysActive: user.daysActive,
      },
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
