import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getUsers } from "./users.controller.js";

const r = Router();

r.use(authMiddleware);
r.get("/", getUsers);

export const usersRouter = r;
