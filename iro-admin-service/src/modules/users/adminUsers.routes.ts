import { Router } from "express";
import * as c from "./adminUsers.controller.js";

const r = Router();

r.get("/", (req, res, next) => void c.getUsers(req, res).catch(next));
r.get("/:id/network", (req, res, next) => void c.getNetwork(req, res).catch(next));
r.get("/:id/referrals", (req, res, next) => void c.getReferrals(req, res).catch(next));
r.patch("/:id/status", (req, res, next) => void c.patchStatusHandler(req, res).catch(next));
r.get("/:id", (req, res, next) => void c.getUser(req, res).catch(next));
r.patch("/:id", (req, res, next) => void c.patchUser(req, res).catch(next));

export const adminUsersRouter = r;
