import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { referralRouter } from "../modules/referrals/referral.routes.js";
import { taskRouter } from "../modules/tasks/task.routes.js";
import { surveyRouter } from "../modules/surveys/survey.routes.js";
import { electionRouter } from "../modules/elections/election.routes.js";
import { leadershipRouter } from "../modules/leadership/leadership.routes.js";
import { analyticsRouter } from "../modules/analytics/analytics.routes.js";
import { hierarchyRouter } from "../modules/hierarchy/hierarchy.routes.js";
import { campaignsRouter } from "../modules/campaigns/campaigns.routes.js";
import { notificationsRouter } from "../modules/notifications/notifications.routes.js";
import { boothsRouter } from "../modules/booths/booths.routes.js";

const api = Router();

api.get("/health", (_req, res) => {
  res.json({ ok: true, service: "iro-server" });
});

api.use("/auth", authRouter);
api.use("/referral", referralRouter);
api.use("/tasks", taskRouter);
api.use("/surveys", surveyRouter);
api.use("/elections", electionRouter);
api.use("/leadership", leadershipRouter);
api.use("/analytics", analyticsRouter);
api.use("/hierarchy", hierarchyRouter);
api.use("/campaigns", campaignsRouter);
api.use("/notifications", notificationsRouter);
api.use("/booths", boothsRouter);

export { api };
