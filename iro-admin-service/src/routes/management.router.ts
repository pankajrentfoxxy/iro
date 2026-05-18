import { Router } from "express";
import { z } from "zod";
import type { AdminCampaignStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ok } from "../lib/response.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../lib/errors.js";
import { jurisdictionUserWhere, jurisdictionHierarchyWhere } from "../lib/jurisdiction.js";
import { canManageLevel } from "../lib/rbac.js";
import {
  assertUserInScope,
  userNetworkTree,
} from "../modules/users/adminUsers.service.js";
import { adminNotificationQueue } from "../config/queues.js";
import { emitAdminEvent } from "../config/socket.js";
import { assignBoothWorker, unassignBoothWorker } from "../modules/booths/adminBooths.service.js";

const rolesR = Router();

rolesR.get("/hierarchy", async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({ orderBy: { levelCode: "asc" } });
    return ok(res, { roles });
  } catch (e) {
    next(e);
  }
});

rolesR.post("/promote", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const schema = z.object({
      userId: z.string().min(1),
      targetRoleLevel: z.string().min(2),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError("Invalid body", parsed.error.flatten());

    await assertUserInScope(viewer, parsed.data.userId);
    if (!canManageLevel(viewer.role?.levelCode, parsed.data.targetRoleLevel)) {
      throw new ForbiddenError("Cannot assign this role level");
    }
    const roleRow = await prisma.role.findUnique({
      where: { levelCode: parsed.data.targetRoleLevel.trim().toUpperCase() },
    });
    if (!roleRow) throw new ValidationError("Unknown role level");

    const user = await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { roleId: roleRow.id },
      include: { role: true },
    });
    emitAdminEvent("role_changed", { userId: user.id, roleLevel: user.role?.levelCode });
    return ok(res, { user });
  } catch (e) {
    next(e);
  }
});

rolesR.post("/demote", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const schema = z.object({
      userId: z.string().min(1),
      targetRoleLevel: z.string().min(2),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError("Invalid body", parsed.error.flatten());

    await assertUserInScope(viewer, parsed.data.userId);
    if (!canManageLevel(viewer.role?.levelCode, parsed.data.targetRoleLevel)) {
      throw new ForbiddenError("Cannot assign this role level");
    }
    const roleRow = await prisma.role.findUnique({
      where: { levelCode: parsed.data.targetRoleLevel.trim().toUpperCase() },
    });
    if (!roleRow) throw new ValidationError("Unknown role level");

    const user = await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { roleId: roleRow.id },
      include: { role: true },
    });
    emitAdminEvent("role_changed", { userId: user.id, roleLevel: user.role?.levelCode });
    return ok(res, { user });
  } catch (e) {
    next(e);
  }
});

const referralsR = Router();

referralsR.get("/tree/:userId", async (req, res, next) => {
  try {
    const depth = req.query.depth ? Number(req.query.depth) : 4;
    const data = await userNetworkTree(req.user!, req.params.userId, Math.min(8, depth || 4));
    return ok(res, data);
  } catch (e) {
    next(e);
  }
});

referralsR.get("/stats/:userId", async (req, res, next) => {
  try {
    await assertUserInScope(req.user!, req.params.userId);
    const u = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: {
        totalReferrals: true,
        networkSize: true,
        leadershipScore: true,
        surveysSubmitted: true,
      },
    });
    if (!u) throw new NotFoundError("User");
    return ok(res, u);
  } catch (e) {
    next(e);
  }
});

referralsR.get("/leaderboard", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const rows = await prisma.user.findMany({
      where: jurisdictionUserWhere(viewer),
      orderBy: { totalReferrals: "desc" },
      take: limit,
      select: {
        id: true,
        fullName: true,
        referralCode: true,
        totalReferrals: true,
        networkSize: true,
        leadershipScore: true,
        role: { select: { levelCode: true, roleName: true } },
      },
    });
    return ok(res, { items: rows });
  } catch (e) {
    next(e);
  }
});

const boothsR = Router();

boothsR.get("/", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const rows = await prisma.hierarchyLocation.findMany({
      where: { type: "BOOTH", AND: [jurisdictionHierarchyWhere(viewer)] },
      take: 500,
      orderBy: { name: "asc" },
      include: {
        boothDetail: true,
        _count: { select: { usersBooth: true } },
      },
    });
    return ok(res, { items: rows });
  } catch (e) {
    next(e);
  }
});

boothsR.get("/:id", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const booth = await prisma.hierarchyLocation.findFirst({
      where: {
        id: req.params.id,
        type: "BOOTH",
        AND: [jurisdictionHierarchyWhere(viewer)],
      },
      include: {
        boothDetail: true,
        parent: { select: { id: true, name: true, type: true } },
        _count: { select: { usersBooth: true } },
        usersBooth: {
          select: {
            id: true,
            fullName: true,
            referralCode: true,
            role: { select: { levelCode: true, roleName: true } },
          },
          orderBy: { fullName: "asc" },
          take: 100,
        },
      },
    });
    if (!booth) throw new NotFoundError("Booth");
    return ok(res, booth);
  } catch (e) {
    next(e);
  }
});

boothsR.patch("/:id", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const schema = z.object({ name: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError("Invalid body", parsed.error.flatten());

    const booth = await prisma.hierarchyLocation.findFirst({
      where: { id: req.params.id, type: "BOOTH", AND: [jurisdictionHierarchyWhere(viewer)] },
    });
    if (!booth) throw new NotFoundError("Booth");

    const updated = await prisma.hierarchyLocation.update({
      where: { id: booth.id },
      data: { name: parsed.data.name },
    });
    emitAdminEvent("booth_updated", { boothId: updated.id });
    return ok(res, updated);
  } catch (e) {
    next(e);
  }
});

boothsR.post("/assign-worker", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const schema = z.object({ boothId: z.string().min(1), userId: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError("Invalid body", parsed.error.flatten());

    const user = await assignBoothWorker(viewer, parsed.data.boothId, parsed.data.userId);
    emitAdminEvent("booth_assigned", { userId: user.id, boothId: parsed.data.boothId });
    return ok(res, { user });
  } catch (e) {
    next(e);
  }
});

boothsR.post("/unassign-worker", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const schema = z.object({ userId: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError("Invalid body", parsed.error.flatten());

    const user = await unassignBoothWorker(viewer, parsed.data.userId);
    emitAdminEvent("booth_unassigned", { userId: user.id });
    return ok(res, { user });
  } catch (e) {
    next(e);
  }
});

const surveysR = Router();

surveysR.get("/", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const page = Number(req.query.page) || 1;
    const pageSize = Math.min(100, Number(req.query.pageSize) || 25);
    const sentiment = req.query.sentiment as string | undefined;

    const where = {
      user: jurisdictionUserWhere(viewer),
      ...(sentiment ? { sentiment: sentiment as "SUPPORTIVE" | "NEUTRAL" | "OPPOSITION" } : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.survey.count({ where }),
      prisma.survey.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { submittedAt: "desc" },
        include: {
          user: { select: { id: true, fullName: true, referralCode: true } },
        },
      }),
    ]);
    return ok(res, { page, pageSize, total, items });
  } catch (e) {
    next(e);
  }
});

surveysR.get("/analytics", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const grouped = await prisma.survey.groupBy({
      by: ["sentiment"],
      where: { user: jurisdictionUserWhere(viewer) },
      _count: { _all: true },
    });
    return ok(res, { bySentiment: grouped });
  } catch (e) {
    next(e);
  }
});

surveysR.get("/:id", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const row = await prisma.survey.findFirst({
      where: { id: req.params.id, user: jurisdictionUserWhere(viewer) },
      include: { user: { select: { id: true, fullName: true } } },
    });
    if (!row) throw new NotFoundError("Survey");
    return ok(res, row);
  } catch (e) {
    next(e);
  }
});

const tasksR = Router();

tasksR.post("/", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      assignedToId: z.string().optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
      dueDate: z.string().datetime().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError("Invalid body", parsed.error.flatten());
    if (parsed.data.assignedToId) await assertUserInScope(viewer, parsed.data.assignedToId);

    const task = await prisma.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        assignedById: viewer.id,
        assignedToId: parsed.data.assignedToId ?? undefined,
        priority: parsed.data.priority ?? "MEDIUM",
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      },
    });
    emitAdminEvent("task_created", { taskId: task.id });
    return ok(res, task, 201);
  } catch (e) {
    next(e);
  }
});

tasksR.get("/", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const scope = jurisdictionUserWhere(viewer);
    const page = Number(req.query.page) || 1;
    const pageSize = Math.min(100, Number(req.query.pageSize) || 25);
    const status = req.query.status as string | undefined;

    const where = {
      OR: [{ assignedById: viewer.id }, { assignedTo: scope }],
      ...(status ? { status: status as "PENDING" | "IN_PROGRESS" | "COMPLETED" } : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          assignedBy: { select: { id: true, fullName: true } },
          assignedTo: { select: { id: true, fullName: true } },
        },
      }),
    ]);
    return ok(res, { page, pageSize, total, items });
  } catch (e) {
    next(e);
  }
});

tasksR.patch("/:id", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) throw new NotFoundError("Task");
    if (task.assignedById !== viewer.id) {
      if (!task.assignedToId) throw new ForbiddenError();
      await assertUserInScope(viewer, task.assignedToId);
    }

    const schema = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
      dueDate: z.string().datetime().nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError("Invalid body", parsed.error.flatten());

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        ...parsed.data,
        dueDate:
          parsed.data.dueDate === undefined
            ? undefined
            : parsed.data.dueDate
              ? new Date(parsed.data.dueDate)
              : null,
      },
    });
    emitAdminEvent("task_updated", { taskId: updated.id });
    return ok(res, updated);
  } catch (e) {
    next(e);
  }
});

tasksR.patch("/:id/complete", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) throw new NotFoundError("Task");
    if (task.assignedToId) await assertUserInScope(viewer, task.assignedToId);

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    emitAdminEvent("task_completed", { taskId: updated.id });
    return ok(res, updated);
  } catch (e) {
    next(e);
  }
});

const analyticsR = Router();

analyticsR.get("/dashboard", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const scope = jurisdictionUserWhere(viewer);
    const since = new Date(Date.now() - 7 * 86400000);

    const [userCount, activeUsers, surveysWeek, tasksPending, roleDistribution] = await prisma.$transaction([
      prisma.user.count({ where: scope }),
      prisma.user.count({ where: { ...scope, status: "ACTIVE" } }),
      prisma.survey.count({ where: { user: scope, submittedAt: { gte: since } } }),
      prisma.task.count({
        where: {
          OR: [{ assignedById: viewer.id }, { assignedTo: scope }],
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
      }),
      prisma.user.groupBy({
        by: ["roleId"],
        where: scope,
        orderBy: { roleId: "asc" },
        _count: { _all: true },
      }),
    ]);

    const roles = await prisma.role.findMany({
      where: { id: { in: roleDistribution.map((r: { roleId: string | null }) => r.roleId).filter(Boolean) as string[] } },
    });
    const roleMap = new Map(roles.map((r: { id: string; levelCode: string }) => [r.id, r.levelCode]));

    return ok(res, {
      users: { total: userCount, active: activeUsers },
      surveysLast7d: surveysWeek,
      tasksPending,
      roleDistribution: roleDistribution.map((row) => {
        const cnt =
          row._count && typeof row._count === "object" && "_all" in row._count
            ? Number((row._count as { _all: number })._all)
            : 0;
        return {
          roleId: row.roleId,
          levelCode: row.roleId ? roleMap.get(row.roleId) ?? null : null,
          count: cnt,
        };
      }),
    });
  } catch (e) {
    next(e);
  }
});

analyticsR.get("/network", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const scope = jurisdictionUserWhere(viewer);
    const agg = await prisma.user.aggregate({
      where: scope,
      _sum: { networkSize: true, totalReferrals: true },
      _avg: { leadershipScore: true },
    });
    return ok(res, agg);
  } catch (e) {
    next(e);
  }
});

analyticsR.get("/booth", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const booths = await prisma.hierarchyLocation.findMany({
      where: { type: "BOOTH", AND: [jurisdictionHierarchyWhere(viewer)] },
      take: 200,
      include: {
        boothDetail: true,
        _count: { select: { usersBooth: true } },
      },
    });
    return ok(res, { items: booths });
  } catch (e) {
    next(e);
  }
});

analyticsR.get("/referrals", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const scope = jurisdictionUserWhere(viewer);
    const [referralEdges, activeReferrers] = await prisma.$transaction([
      prisma.referral.count({ where: { referrer: scope } }),
      prisma.user.count({ where: { ...scope, totalReferrals: { gt: 0 } } }),
    ]);
    return ok(res, { referralEdges, activeReferrers });
  } catch (e) {
    next(e);
  }
});

const notificationsR = Router();

notificationsR.post("/send", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const schema = z.object({
      title: z.string().min(1),
      body: z.string().min(1),
      deepLink: z.string().optional(),
      targetRoleLevel: z.string().optional(),
      userIds: z.array(z.string()).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError("Invalid body", parsed.error.flatten());

    let recipients: { id: string }[] = [];
    if (parsed.data.userIds?.length) {
      for (const id of parsed.data.userIds) {
        await assertUserInScope(viewer, id);
      }
      recipients = parsed.data.userIds.map((id) => ({ id }));
    } else {
      const where = {
        ...jurisdictionUserWhere(viewer),
        ...(parsed.data.targetRoleLevel
          ? { role: { levelCode: parsed.data.targetRoleLevel.trim().toUpperCase() } }
          : {}),
      };
      recipients = await prisma.user.findMany({ where, select: { id: true }, take: 5000 });
    }

    const rows = recipients.map((u) => ({
      userId: u.id,
      type: "ADMIN_BROADCAST",
      title: parsed.data.title,
      body: parsed.data.body,
      deepLink: parsed.data.deepLink ?? null,
    }));

    await prisma.userNotification.createMany({ data: rows });

    await adminNotificationQueue.add("deliver", {
      title: parsed.data.title,
      count: rows.length,
      actorId: viewer.id,
    });

    emitAdminEvent("notification_broadcast", { count: rows.length });
    return ok(res, { deliveredTo: rows.length });
  } catch (e) {
    next(e);
  }
});

notificationsR.get("/", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const items = await prisma.userNotification.findMany({
      where: { user: jurisdictionUserWhere(viewer) },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return ok(res, { items });
  } catch (e) {
    next(e);
  }
});

const auditR = Router();

auditR.get("/", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const page = Number(req.query.page) || 1;
    const pageSize = Math.min(100, Number(req.query.pageSize) || 50);
    const scope = jurisdictionUserWhere(viewer);

    const rows = await prisma.auditLog.findMany({
      where: {
        OR: [{ userId: viewer.id }, { user: scope }],
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, fullName: true } } },
    });

    return ok(res, { page, pageSize, items: rows });
  } catch (e) {
    next(e);
  }
});

const hierarchyR = Router();

hierarchyR.get("/locations", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const parentId = typeof req.query.parentId === "string" ? req.query.parentId : undefined;
    const rows = await prisma.hierarchyLocation.findMany({
      where: {
        AND: [
          jurisdictionHierarchyWhere(viewer),
          parentId ? { parentId } : {},
        ],
      },
      take: 500,
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, type: true, name: true, parentId: true },
    });
    return ok(res, { items: rows });
  } catch (e) {
    next(e);
  }
});

const campaignsR = Router();

campaignsR.get("/", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const lv = viewer.role?.levelCode ?? "";
    let where: Prisma.AdminCampaignWhereInput = { deletedAt: null };
    if (lv !== "L1" && lv !== "L2") {
      where = {
        ...where,
        OR: [
          { createdById: viewer.id },
          ...(viewer.stateId ? [{ scopeStateId: viewer.stateId }] : []),
        ],
      };
    }

    const items = await prisma.adminCampaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return ok(res, { items });
  } catch (e) {
    next(e);
  }
});

campaignsR.post("/", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "COMPLETED"]).optional(),
      startsAt: z.string().datetime().optional(),
      endsAt: z.string().datetime().optional(),
      targetRoleLevel: z.string().optional(),
      scopeStateId: z.string().optional(),
      scopeDistrictId: z.string().optional(),
      scopeBlockId: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError("Invalid body", parsed.error.flatten());

    const row = await prisma.adminCampaign.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        status: (parsed.data.status ?? "DRAFT") as AdminCampaignStatus,
        startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : undefined,
        endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : undefined,
        targetRoleLevel: parsed.data.targetRoleLevel,
        scopeStateId: parsed.data.scopeStateId ?? viewer.stateId,
        scopeDistrictId: parsed.data.scopeDistrictId ?? viewer.districtId,
        scopeBlockId: parsed.data.scopeBlockId ?? viewer.blockId,
        createdById: viewer.id,
      },
    });
    emitAdminEvent("campaign_created", { campaignId: row.id });
    return ok(res, row, 201);
  } catch (e) {
    next(e);
  }
});

campaignsR.patch("/:id", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const schema = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "COMPLETED"]).optional(),
      startsAt: z.string().datetime().nullable().optional(),
      endsAt: z.string().datetime().nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError("Invalid body", parsed.error.flatten());

    const existing = await prisma.adminCampaign.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Campaign");
    if (existing.createdById !== viewer.id && (viewer.role?.levelCode !== "L1" && viewer.role?.levelCode !== "L2")) {
      throw new ForbiddenError();
    }

    const updated = await prisma.adminCampaign.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        startsAt:
          parsed.data.startsAt === undefined
            ? undefined
            : parsed.data.startsAt
              ? new Date(parsed.data.startsAt)
              : null,
        endsAt:
          parsed.data.endsAt === undefined ? undefined : parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      },
    });
    return ok(res, updated);
  } catch (e) {
    next(e);
  }
});

campaignsR.delete("/:id", async (req, res, next) => {
  try {
    const viewer = req.user!;
    const existing = await prisma.adminCampaign.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new NotFoundError("Campaign");
    if (existing.createdById !== viewer.id && viewer.role?.levelCode !== "L1") throw new ForbiddenError();

    await prisma.adminCampaign.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), status: "PAUSED" },
    });
    return ok(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

export const managementRouter = Router();
managementRouter.use("/roles", rolesR);
managementRouter.use("/referrals", referralsR);
managementRouter.use("/booths", boothsR);
managementRouter.use("/surveys", surveysR);
managementRouter.use("/tasks", tasksR);
managementRouter.use("/analytics", analyticsR);
managementRouter.use("/notifications", notificationsR);
managementRouter.use("/audit-logs", auditR);
managementRouter.use("/hierarchy", hierarchyR);
managementRouter.use("/campaigns", campaignsR);
