import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getMySurveys, postSurvey } from "./survey.controller.js";

const r = Router();
r.use(authMiddleware);
r.post("/", postSurvey);
r.get("/me", getMySurveys);

export const surveyRouter = r;
