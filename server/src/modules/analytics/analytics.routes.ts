import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireLevels } from "../../middleware/role.middleware.js";
import {
  getAnalyticsDashboard,
  getAnalyticsOverview,
  getTopInfluencers,
} from "./analytics.controller.js";

const r = Router();
r.use(authMiddleware);
r.get("/overview", getAnalyticsOverview);
r.get("/influencers", getTopInfluencers);
r.get("/dashboard", requireLevels("L1", "L2", "L3", "L4", "L5", "L6"), getAnalyticsDashboard);

export const analyticsRouter = r;
