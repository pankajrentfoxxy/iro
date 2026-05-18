import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { listEvents, postEventRsvp } from "./events.controller.js";

const r = Router();

r.use(authMiddleware);
r.get("/", listEvents);
r.post("/:id/rsvp", postEventRsvp);

export const eventsRouter = r;
