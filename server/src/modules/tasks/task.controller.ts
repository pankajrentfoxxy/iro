import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { ValidationError } from "../../lib/errors.js";
import {
  completeTaskSchema,
  createTaskSchema,
  taskService,
} from "./task.service.js";

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) throw new ValidationError("Invalid body", r.error.flatten());
  return r.data;
}

export async function postTask(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parse(createTaskSchema, req.body);
    const task = await taskService.createTask(body, req.user!);
    ok(res, { task }, 201);
  } catch (e) {
    next(e);
  }
}

export async function getTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const assignedTo = typeof req.query.assigned_to === "string" ? req.query.assigned_to : undefined;
    const dueTodayRaw = req.query.due_today;
    const dueToday =
      dueTodayRaw === "true" || dueTodayRaw === "1" || dueTodayRaw === "yes";
    const assignedToMeOnly = assignedTo === "me";

    const tasks = await taskService.list(req.user!, status, {
      assignedToMeOnly,
      dueToday,
    });
    ok(res, { tasks });
  } catch (e) {
    next(e);
  }
}

export async function patchTaskComplete(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parse(completeTaskSchema, req.body);
    const task = await taskService.complete(req.params.id!, req.user!, body);
    ok(res, { task });
  } catch (e) {
    next(e);
  }
}
