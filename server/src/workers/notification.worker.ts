import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { getRedis } from "../config/redis.js";

const connection = { url: env.REDIS_URL };

export const notificationWorker = new Worker(
  "notification",
  async (job) => {
    logger.info("notification job", { id: job.id, data: job.data });
    const redis = getRedis();
    await redis.publish(
      "iro:events",
      JSON.stringify({ type: "notification", data: job.data }),
    );
  },
  { connection },
);

notificationWorker.on("failed", (job, err) => {
  logger.error("notification job failed", { id: job?.id, err: err.message });
});
