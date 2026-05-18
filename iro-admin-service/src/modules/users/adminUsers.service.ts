import type { Prisma, UserStatus } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { NotFoundError } from "../../lib/errors.js";
import { decryptPhone, maskPhoneTail } from "../../lib/crypto.js";
import { jurisdictionUserWhere } from "../../lib/jurisdiction.js";
import { levelRank } from "../../lib/rbac.js";
import type { AdminAuthUser } from "../../types/auth.js";

export async function assertUserInScope(viewer: AdminAuthUser, targetId: string) {
  const base = jurisdictionUserWhere(viewer);
  const n = await prisma.user.count({ where: { AND: [base, { id: targetId }] } });
  if (!n) throw new NotFoundError("User");
}

export async function listUsers(
  viewer: AdminAuthUser,
  query: {
    page: number;
    pageSize: number;
    search?: string;
    roleLevel?: string;
    status?: UserStatus;
    sort?: "createdAt" | "fullName";
    dir?: "asc" | "desc";
  },
) {
  const where: Prisma.UserWhereInput = {
    ...jurisdictionUserWhere(viewer),
  };

  if (query.search?.trim()) {
    where.OR = [
      { fullName: { contains: query.search.trim(), mode: "insensitive" } },
      { email: { contains: query.search.trim(), mode: "insensitive" } },
      { referralCode: { contains: query.search.trim(), mode: "insensitive" } },
    ];
  }
  if (query.roleLevel) {
    where.role = { levelCode: query.roleLevel.trim().toUpperCase() };
  }
  if (query.status) where.status = query.status;

  const skip = (query.page - 1) * query.pageSize;
  const orderBy: Prisma.UserOrderByWithRelationInput =
    query.sort === "fullName"
      ? { fullName: query.dir ?? "asc" }
      : { createdAt: query.dir ?? "desc" };

  const [total, rows] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy,
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        referralCode: true,
        totalReferrals: true,
        networkSize: true,
        leadershipScore: true,
        createdAt: true,
        stateLabel: true,
        districtLabel: true,
        blockLabel: true,
        village: true,
        role: { select: { levelCode: true, roleName: true } },
        booth: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    page: query.page,
    pageSize: query.pageSize,
    total,
    items: rows,
  };
}

export async function getUserDetail(viewer: AdminAuthUser, targetId: string) {
  await assertUserInScope(viewer, targetId);
  const user = await prisma.user.findUnique({
    where: { id: targetId },
    include: {
      role: true,
      state: { select: { id: true, name: true, type: true } },
      district: { select: { id: true, name: true, type: true } },
      block: { select: { id: true, name: true, type: true } },
      booth: { select: { id: true, name: true, type: true } },
      referredBy: { select: { id: true, fullName: true, referralCode: true } },
    },
  });
  if (!user) throw new NotFoundError("User");

  let phoneMasked = "****";
  try {
    const plain = decryptPhone(user.phoneEncrypted);
    phoneMasked =
      levelRank(viewer.role?.levelCode) <= 2 ? plain : maskPhoneTail(plain);
  } catch {
    /* noop */
  }

  return {
    id: user.id,
    fullName: user.fullName,
    phoneMasked,
    email: user.email,
    status: user.status,
    referralCode: user.referralCode,
    role: user.role,
    location: {
      state: user.state,
      district: user.district,
      block: user.block,
      booth: user.booth,
      labels: {
        stateLabel: user.stateLabel,
        districtLabel: user.districtLabel,
        blockLabel: user.blockLabel,
        village: user.village,
        pincode: user.pincode,
      },
    },
    referredBy: user.referredBy,
    stats: {
      totalReferrals: user.totalReferrals,
      networkSize: user.networkSize,
      leadershipScore: user.leadershipScore,
      tasksCompleted: user.tasksCompleted,
      surveysSubmitted: user.surveysSubmitted,
    },
    createdAt: user.createdAt,
  };
}

export async function patchUserProfile(
  viewer: AdminAuthUser,
  targetId: string,
  body: Prisma.UserUpdateInput,
) {
  await assertUserInScope(viewer, targetId);
  const updated = await prisma.user.update({
    where: { id: targetId },
    data: body,
    include: { role: { select: { levelCode: true, roleName: true } } },
  });
  return updated;
}

export async function patchUserStatus(viewer: AdminAuthUser, targetId: string, status: UserStatus) {
  await assertUserInScope(viewer, targetId);
  return prisma.user.update({
    where: { id: targetId },
    data: { status },
    select: { id: true, status: true },
  });
}

export async function userReferralFlat(viewer: AdminAuthUser, targetId: string) {
  await assertUserInScope(viewer, targetId);
  const edges = await prisma.referral.findMany({
    where: { referrerUserId: targetId },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      referred: {
        select: {
          id: true,
          fullName: true,
          referralCode: true,
          createdAt: true,
          role: { select: { levelCode: true, roleName: true } },
        },
      },
    },
  });
  return { items: edges.map((e: (typeof edges)[number]) => ({ edge: { id: e.id, createdAt: e.createdAt }, user: e.referred })) };
}

export interface AdminNetworkNode {
  id: string;
  name: string;
  code: string | null;
  roleLevel: string | null;
  children: AdminNetworkNode[];
}

export async function userNetworkTree(
  viewer: AdminAuthUser,
  targetId: string,
  maxDepth = 4,
): Promise<{ tree: AdminNetworkNode }> {
  await assertUserInScope(viewer, targetId);

  async function loadChildren(parentId: string, depth: number): Promise<AdminNetworkNode[]> {
    if (depth <= 0) return [];
    const kids = await prisma.user.findMany({
      where: { referredById: parentId },
      select: {
        id: true,
        fullName: true,
        referralCode: true,
        role: { select: { levelCode: true } },
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    const out: AdminNetworkNode[] = [];
    for (const k of kids) {
      out.push({
        id: k.id,
        name: k.fullName,
        code: k.referralCode,
        roleLevel: k.role?.levelCode ?? null,
        children: await loadChildren(k.id, depth - 1),
      });
    }
    return out;
  }

  const root = await prisma.user.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      fullName: true,
      referralCode: true,
      role: { select: { levelCode: true } },
    },
  });
  if (!root) throw new NotFoundError("User");

  const tree: AdminNetworkNode = {
    id: root.id,
    name: root.fullName,
    code: root.referralCode,
    roleLevel: root.role?.levelCode ?? null,
    children: await loadChildren(root.id, maxDepth),
  };
  return { tree };
}
