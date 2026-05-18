import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { listNotifications, markNotificationsReadAll } from "./notifications.controller.js";

const r = Router();

r.use(authMiddleware);
r.get("/", listNotifications);
r.patch("/read-all", markNotificationsReadAll);

export const notificationsRouter = r;
