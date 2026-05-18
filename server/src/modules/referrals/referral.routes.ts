import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireLevels } from "../../middleware/role.middleware.js";
import {
  getMyReferralNetwork,
  getReferralLeaderboard,
  getReferralStats,
  getReferralTree,
  postAssignReferralRole,
} from "./referral.controller.js";

const r = Router();

r.use(authMiddleware);
r.get("/my-network", getMyReferralNetwork);
r.get("/tree", getReferralTree);
r.get("/leaderboard", getReferralLeaderboard);
r.get("/stats", getReferralStats);
r.post("/assign-role", requireLevels("L1", "L2", "L3"), postAssignReferralRole);

export const referralRouter = r;
