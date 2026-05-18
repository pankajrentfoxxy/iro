import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/db.js";
import { ok } from "../../lib/response.js";

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const notifications = await prisma.userNotification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    ok(res, { notifications });
  } catch (e) {
    next(e);
  }
}

export async function markNotificationsReadAll(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.userNotification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    ok(res, { ok: true });
  } catch (e) {
    next(e);
  }
}
