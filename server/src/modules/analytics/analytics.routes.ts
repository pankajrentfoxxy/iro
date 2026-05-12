import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getAnalyticsOverview, getTopInfluencers } from "./analytics.controller.js";

const r = Router();
r.use(authMiddleware);
r.get("/overview", getAnalyticsOverview);
r.get("/influencers", getTopInfluencers);

export const analyticsRouter = r;
