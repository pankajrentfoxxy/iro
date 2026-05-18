import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { ValidationError } from "../../lib/errors.js";
import {
  questionnaireBatchSchema,
  questionnaireRespondSchema,
  submitSurveySchema,
  surveyService,
} from "./survey.service.js";

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) throw new ValidationError("Invalid body", r.error.flatten());
  return r.data;
}

export async function postSurvey(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parse(submitSurveySchema, req.body);
    const survey = await surveyService.submit(req.user!, body);
    ok(res, { survey }, 201);
  } catch (e) {
    next(e);
  }
}

export async function getMySurveys(req: Request, res: Response, next: NextFunction) {
  try {
    const surveys = await surveyService.mine(req.user!.id);
    ok(res, { surveys });
  } catch (e) {
    next(e);
  }
}

export async function listQuestionnaires(req: Request, res: Response, next: NextFunction) {
  try {
    const surveys = await surveyService.listQuestionnaires(req.user!);
    ok(res, { surveys });
  } catch (e) {
    next(e);
  }
}

export async function postQuestionnaireRespond(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parse(questionnaireRespondSchema, req.body);
    const response = await surveyService.respondQuestionnaire(req.user!, req.params.id!, body);
    ok(res, { response }, 201);
  } catch (e) {
    next(e);
  }
}

export async function postQuestionnaireBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parse(questionnaireBatchSchema, req.body);
    const out = await surveyService.batchQuestionnaires(req.user!, body.responses);
    ok(res, out);
  } catch (e) {
    next(e);
  }
}
