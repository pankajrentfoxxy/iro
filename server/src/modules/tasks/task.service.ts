import { z } from "zod";
import { taskRepository } from "./task.repository.js";
import { prisma } from "../../config/db.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../lib/errors.js";
import type { AuthUser } from "../../types/auth.js";
import { userRepository } from "../users/user.repository.js";
import { leadershipQueue } from "../../config/queues.js";

export const createTaskSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().max(5000).optional().nullable(),
  assignedToId: z.string().uuid(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
});

export const listTaskSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
});

export const completeTaskSchema = z.object({
  gpsLat: z.number().optional().nullable(),
  gpsLong: z.number().optional().nullable(),
  proofImageUrl: z.string().url().optional().nullable(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export class TaskService {
  async createTask(input: CreateTaskInput, by: AuthUser) {
    const assignee = await userRepository.findById(input.assignedToId);
    if (!assignee) throw new NotFoundError("Assignee not found");

    if (by.stateId && assignee.stateId && assignee.stateId !== by.stateId) {
      throw new ForbiddenError("Assignee outside jurisdiction");
    }

    return taskRepository.create({
      title: input.title,
      description: input.description ?? undefined,
      priority: input.priority ?? "MEDIUM",
      assignedBy: { connect: { id: by.id } },
      assignedTo: { connect: { id: input.assignedToId } },
    });
  }

  async list(
    viewer: AuthUser,
    status?: string,
    opts?: { assignedToMeOnly?: boolean; dueToday?: boolean },
  ) {
    return taskRepository.listForViewer(viewer, {
      status: status as "PENDING" | "IN_PROGRESS" | "COMPLETED" | undefined,
      assignedToMeOnly: opts?.assignedToMeOnly ?? false,
      dueToday: opts?.dueToday ?? false,
    });
  }

  async complete(taskId: string, viewer: AuthUser, body: z.infer<typeof completeTaskSchema>) {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new NotFoundError("Task not found");
    if (task.assignedToId !== viewer.id && task.assignedById !== viewer.id) {
      throw new ForbiddenError();
    }
    if (task.status === "COMPLETED") throw new ValidationError("Already completed");

    const updated = await taskRepository.complete(taskId, body);
    await prisma.user.update({
      where: { id: task.assignedToId! },
      data: { tasksCompleted: { increment: 1 } },
    });
    await leadershipQueue.add("recalc", { userId: task.assignedToId }, { removeOnComplete: true });
    return updated;
  }
}

export const taskService = new TaskService();
