import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { getRedis } from "../config/redis.js";
import { leadershipService } from "../modules/leadership/leadership.service.js";

const connection = { url: env.REDIS_URL };

export const analyticsWorker = new Worker(
  "analytics",
  async (job) => {
    logger.info("analytics job", { id: job.id, data: job.data });
    const redis = getRedis();
    await redis.publish(
      "iro:events",
      JSON.stringify({ type: "analytics_refresh", data: job.data }),
    );
  },
  { connection },
);

analyticsWorker.on("failed", (job, err) => {
  logger.error("analytics job failed", { id: job?.id, err: err.message });
});

export const leadershipWorker = new Worker(
  "leadership",
  async (job) => {
    const userId = (job.data as { userId?: string }).userId;
    if (!userId) return;
    await leadershipService.recalculateUser(userId);
    const redis = getRedis();
    await redis.publish(
      "iro:events",
      JSON.stringify({ type: "leaderboard:refresh", data: { userId } }),
    );
  },
  { connection },
);

leadershipWorker.on("failed", (job, err) => {
  logger.error("leadership job failed", { id: job?.id, err: err.message });
});
