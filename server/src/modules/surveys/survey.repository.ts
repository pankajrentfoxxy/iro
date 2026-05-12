import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";

export class SurveyRepository {
  async create(data: Prisma.SurveyCreateInput) {
    return prisma.survey.create({ data });
  }

  async listForUser(userId: string) {
    return prisma.survey.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      take: 100,
    });
  }
}

export const surveyRepository = new SurveyRepository();
