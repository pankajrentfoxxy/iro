import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/db.js";
import { ok } from "../../lib/response.js";

export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const level =
      typeof req.query.level === "string" && req.query.level.length > 0 ? req.query.level : undefined;

    const events = await prisma.orgEvent.findMany({
      where: level ? { level } : {},
      orderBy: { startsAt: "asc" },
      include: {
        _count: { select: { rsvps: true } },
        rsvps: { where: { userId: req.user!.id }, take: 1 },
      },
    });

    const result = events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      level: e.level,
      jurisdictionId: e.jurisdictionId,
      date: e.startsAt,
      endDate: e.endsAt,
      venueAddress: e.venueAddress,
      venueGpsLat: e.venueGpsLat,
      venueGpsLng: e.venueGpsLng,
      bannerUrl: e.bannerUrl,
      expectedCount: e.expectedCount,
      createdAt: e.createdAt,
      rsvpd: e.rsvps.length > 0,
      attendeeCount: e._count.rsvps,
    }));

    ok(res, { events: result });
  } catch (e) {
    next(e);
  }
}

export async function postEventRsvp(req: Request, res: Response, next: NextFunction) {
  try {
    const rsvp = await prisma.orgEventRsvp.upsert({
      where: { eventId_userId: { eventId: req.params.id!, userId: req.user!.id } },
      update: {},
      create: { eventId: req.params.id!, userId: req.user!.id },
    });
    ok(res, { rsvp }, 201);
  } catch (e) {
    next(e);
  }
}
