import { z } from "zod";
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
}

export const surveyService = new SurveyService();
