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

  /**
   * BFS load of direct invitees (`referredById`) up to depth/node caps for referral tree APIs.
   */
  async buildReferralSubtree(
    rootId: string,
    opts?: { maxDepth?: number; maxNodes?: number; maxPerLevel?: number },
  ) {
    const maxDepth = Math.max(1, opts?.maxDepth ?? 25);
    const maxNodes = Math.max(2, opts?.maxNodes ?? 2500);
    const maxPerLevel = Math.max(10, opts?.maxPerLevel ?? 500);

    const root = await prisma.user.findUnique({
      where: { id: rootId },
      select: {
        id: true,
        fullName: true,
        role: { select: { levelCode: true } },
      },
    });
    if (!root) return null;

    const nodes = new Map<string, { fullName: string; levelCode: string | null }>();
    nodes.set(root.id, { fullName: root.fullName, levelCode: root.role?.levelCode ?? null });

    const childrenByParent = new Map<string, string[]>();
    let frontier: string[] = [root.id];
    let depth = 0;

    while (frontier.length > 0 && depth < maxDepth && nodes.size < maxNodes) {
      const batch = await prisma.user.findMany({
        where: { referredById: { in: frontier } },
        select: {
          id: true,
          fullName: true,
          referredById: true,
          role: { select: { levelCode: true } },
        },
        orderBy: [{ referredById: "asc" }, { createdAt: "asc" }],
        take: maxPerLevel,
      });

      if (!batch.length) break;

      const nextFrontier: string[] = [];
      for (const u of batch) {
        if (nodes.size >= maxNodes) break;
        const parentId = u.referredById;
        if (!parentId) continue;

        if (!nodes.has(u.id)) {
          nodes.set(u.id, { fullName: u.fullName, levelCode: u.role?.levelCode ?? null });
        }
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
        childrenByParent.get(parentId)!.push(u.id);
        nextFrontier.push(u.id);
      }

      frontier = nextFrontier;
      depth++;
    }

    return { rootId: root.id, nodes, childrenByParent };
  }
}

export const userRepository = new UserRepository();
