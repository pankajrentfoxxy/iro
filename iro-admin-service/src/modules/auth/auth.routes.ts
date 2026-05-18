import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireAdminPanel } from "../../middleware/requireAdmin.middleware.js";
import { loginLimiter } from "../../middleware/rateLimit.middleware.js";
import * as c from "./auth.controller.js";

const r = Router();

r.post("/login", loginLimiter, (req, res, next) => void c.postLogin(req, res).catch(next));
r.post("/refresh", loginLimiter, (req, res, next) => void c.postRefresh(req, res).catch(next));
r.post("/logout", authMiddleware, requireAdminPanel, (req, res, next) =>
  void c.postLogout(req, res).catch(next),
);
r.get("/me", authMiddleware, requireAdminPanel, (req, res, next) => void c.getMe(req, res).catch(next));

export const authRouter = r;
