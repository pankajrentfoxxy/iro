import { Router } from "express";
import { authLimiter } from "../../middleware/rateLimit.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  getMe,
  getMyReferralTree,
  patchMe,
  postOtpRequest,
  postOtpVerify,
  postRefresh,
  postRegister,
} from "./auth.controller.js";

const r = Router();

r.post("/otp/request", authLimiter, postOtpRequest);
r.post("/otp/verify", authLimiter, postOtpVerify);
r.post("/register", authLimiter, postRegister);
r.post("/refresh", authLimiter, postRefresh);
r.get("/me/referrals/tree", authMiddleware, getMyReferralTree);
r.get("/me", authMiddleware, getMe);
r.patch("/me", authMiddleware, patchMe);

export const authRouter = r;
