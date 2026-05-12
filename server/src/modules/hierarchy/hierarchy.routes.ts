import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getHierarchyChildren } from "./hierarchy.controller.js";

const r = Router();
r.use(authMiddleware);
r.get("/locations", getHierarchyChildren);

export const hierarchyRouter = r;
