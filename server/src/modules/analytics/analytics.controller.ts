import type { Request, Response, NextFunction } from "express";
import { ok } from "../../lib/response.js";
import { analyticsService } from "./analytics.service.js";

export async function getAnalyticsOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.overview(req.user!);
    ok(res, data);
  } catch (e) {
    next(e);
  }
}

export async function getTopInfluencers(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const rows = await analyticsService.topInfluencers(req.user!, Number.isFinite(limit) ? limit : 20);
    ok(res, { influencers: rows });
  } catch (e) {
    next(e);
  }
}

export async function getAnalyticsDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.dashboard(req.user!);
    ok(res, data);
  } catch (e) {
    next(e);
  }
}
