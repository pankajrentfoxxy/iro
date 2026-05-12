import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";

const userInclude = {
  role: { select: { id: true, levelCode: true, roleName: true } },
} as const;

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: userInclude,
    });
  }

  async findByPhoneHash(phoneHash: string) {
    return prisma.user.findUnique({
      where: { phoneHash },
      include: userInclude,
    });
  }

  async findByReferralCode(code: string) {
    return prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      include: userInclude,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: userInclude,
    });
  }

  async listByJurisdiction(where: Prisma.UserWhereInput) {
    return prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        referralCode: true,
        leadershipScore: true,
        networkSize: true,
        totalReferrals: true,
        stateId: true,
        districtId: true,
        role: { select: { levelCode: true, roleName: true } },
      },
    });
  }

  async incrementStats(
    id: string,
    patch: Partial<{ tasksCompleted: number; surveysSubmitted: number; daysActive: number }>,
  ) {
    const data: Prisma.UserUpdateInput = {};
    if (patch.tasksCompleted) data.tasksCompleted = { increment: patch.tasksCompleted };
    if (patch.surveysSubmitted) data.surveysSubmitted = { increment: patch.surveysSubmitted };
    if (patch.daysActive) data.daysActive = { increment: patch.daysActive };
    return prisma.user.update({ where: { id }, data, include: userInclude });
  }
}

export const userRepository = new UserRepository();
