import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  getAllowedTargets,
  getMyReferralInvites,
  postReferralInvite,
} from "./referralInvite.controller.js";

const r = Router();

r.use(authMiddleware);
r.get("/allowed-targets", getAllowedTargets);
r.get("/my", getMyReferralInvites);
r.post("/", postReferralInvite);

export const referralInviteRouter = r;
