import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getReferralLeaderboard, getReferralTree } from "./referral.controller.js";

const r = Router();

r.use(authMiddleware);
r.get("/tree", getReferralTree);
r.get("/leaderboard", getReferralLeaderboard);

export const referralRouter = r;
