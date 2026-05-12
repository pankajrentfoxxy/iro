import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { postRecalculateSelf } from "./leadership.controller.js";

const r = Router();
r.use(authMiddleware);
r.post("/recalculate/me", postRecalculateSelf);

export const leadershipRouter = r;
