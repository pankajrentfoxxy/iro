import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getTasks, patchTaskComplete, postTask } from "./task.controller.js";

const r = Router();

r.use(authMiddleware);
r.post("/", postTask);
r.get("/", getTasks);
r.patch("/:id/complete", patchTaskComplete);

export const taskRouter = r;
