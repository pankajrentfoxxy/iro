import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  getMySurveys,
  listQuestionnaires,
  postQuestionnaireBatch,
  postQuestionnaireRespond,
  postSurvey,
} from "./survey.controller.js";

const r = Router();
r.use(authMiddleware);

r.get("/me", getMySurveys);
r.get("/", listQuestionnaires);
r.post("/batch", postQuestionnaireBatch);
r.post("/:id/respond", postQuestionnaireRespond);
r.post("/", postSurvey);

export const surveyRouter = r;
