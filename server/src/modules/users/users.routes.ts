import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getUsers } from "./users.controller.js";
import { getLiveCount, getMeStats } from "./users.stats.controller.js";

const r = Router();

r.get("/live-count", getLiveCount);

r.use(authMiddleware);
r.get("/me/stats", getMeStats);
r.get("/", getUsers);

export const usersRouter = r;
