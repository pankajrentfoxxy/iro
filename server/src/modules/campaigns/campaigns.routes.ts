import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { ok } from "../../lib/response.js";

const r = Router();
r.use(authMiddleware);
r.get("/", (_req, res) => ok(res, { message: "Campaigns module — define CMS integration", items: [] }));

export const campaignsRouter = r;
