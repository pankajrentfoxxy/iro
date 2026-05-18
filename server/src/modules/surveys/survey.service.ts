import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { surveyRepository } from "./survey.repository.js";
import { prisma } from "../../config/db.js";
import { NotFoundError } from "../../lib/errors.js";
import { leadershipQueue } from "../../config/queues.js";
import type { AuthUser } from "../../types/auth.js";

export const submitSurveySchema = z.object({
  boothId: z.string().uuid().optional().nullable(),
  voterName: z.string().max(150).optional().nullable(),
  voterMobile: z.string().max(20).optional().nullable(),
  sentiment: z.enum(["SUPPORTIVE", "NEUTRAL", "OPPOSITION"]),
  gpsLat: z.number().optional().nullable(),
  gpsLong: z.number().optional().nullable(),
  clientSubmissionId: z.string().max(128).optional().nullable(),
});

export type SubmitSurveyInput = z.infer<typeof submitSurveySchema>;

export const questionnaireRespondSchema = z.object({
  answers: z.record(z.unknown()),
  gpsLat: z.number().optional().nullable(),
  gpsLong: z.number().optional().nullable(),
});

export const questionnaireBatchSchema = z.object({
  responses: z.array(
    z.object({
      surveyId: z.string().uuid(),
      answers: z.record(z.unknown()),
      gpsLat: z.number().optional().nullable(),
      gpsLong: z.number().optional().nullable(),
    }),
  ),
});

export class SurveyService {
  async submit(viewer: AuthUser, input: SubmitSurveyInput) {
    if (input.boothId) {
      const booth = await prisma.hierarchyLocation.findFirst({
        where: { id: input.boothId, type: "BOOTH" },
      });
      if (!booth) {
        throw new NotFoundError("Booth not found");
      }
    }

    const survey = await surveyRepository.create({
      user: { connect: { id: viewer.id } },
      boothId: input.boothId ?? undefined,
      voterName: input.voterName ?? undefined,
      voterMobile: input.voterMobile ?? undefined,
      sentiment: input.sentiment,
      gpsLat: input.gpsLat ?? undefined,
      gpsLong: input.gpsLong ?? undefined,
      clientSubmissionId: input.clientSubmissionId ?? undefined,
    });

    await prisma.user.update({
      where: { id: viewer.id },
      data: { surveysSubmitted: { increment: 1 } },
    });

    await leadershipQueue.add("recalc", { userId: viewer.id }, { removeOnComplete: true });
    return survey;
  }

  async mine(userId: string) {
    return surveyRepository.listForUser(userId);
  }

  async listQuestionnaires(viewer: AuthUser) {
    const roleLevel = viewer.role?.levelCode ?? null;

    const rows = await prisma.questionnaire.findMany({
      where: {
        isActive: true,
        OR: [{ targetRoleLevel: null }, { targetRoleLevel: roleLevel }],
      },
      include: {
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const mine = await prisma.questionnaireResponse.findMany({
      where: { userId: viewer.id },
      select: { questionnaireId: true },
    });
    const done = new Set(mine.map((m) => m.questionnaireId));

    return rows.map((row) => {
      const { _count, ...rest } = row;
      return {
        ...rest,
        completed: done.has(row.id),
        responseCount: _count.responses,
      };
    });
  }

  async respondQuestionnaire(
    viewer: AuthUser,
    questionnaireId: string,
    body: z.infer<typeof questionnaireRespondSchema>,
  ) {
    const q = await prisma.questionnaire.findFirst({
      where: { id: questionnaireId, isActive: true },
    });
    if (!q) throw new NotFoundError("Survey");

    const existing = await prisma.questionnaireResponse.findUnique({
      where: { questionnaireId_userId: { questionnaireId, userId: viewer.id } },
    });

    const answersJson = body.answers as Prisma.InputJsonValue;

    const saved = await prisma.questionnaireResponse.upsert({
      where: { questionnaireId_userId: { questionnaireId, userId: viewer.id } },
      create: {
        questionnaireId,
        userId: viewer.id,
        answers: answersJson,
        gpsLat: body.gpsLat ?? undefined,
        gpsLong: body.gpsLong ?? undefined,
      },
      update: {
        answers: answersJson,
        gpsLat: body.gpsLat ?? undefined,
        gpsLong: body.gpsLong ?? undefined,
      },
    });

    if (!existing) {
      await prisma.user.update({
        where: { id: viewer.id },
        data: { surveysSubmitted: { increment: 1 } },
      });

      await leadershipQueue.add("recalc", { userId: viewer.id }, { removeOnComplete: true });
    }

    return saved;
  }

  async batchQuestionnaires(viewer: AuthUser, items: z.infer<typeof questionnaireBatchSchema>["responses"]) {
    let synced = 0;
    for (const row of items) {
      try {
        await this.respondQuestionnaire(viewer, row.surveyId, {
          answers: row.answers,
          gpsLat: row.gpsLat,
          gpsLong: row.gpsLong,
        });
        synced += 1;
      } catch {
        /* skip failing row */
      }
    }
    return { synced };
  }
}

export const surveyService = new SurveyService();
