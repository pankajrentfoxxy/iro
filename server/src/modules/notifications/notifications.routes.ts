import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { ok } from "../../lib/response.js";

const r = Router();
r.use(authMiddleware);
r.get("/", (_req, res) => ok(res, { message: "Use worker + socket channel iro:events for realtime notifications" }));

export const notificationsRouter = r;
