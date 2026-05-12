import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

const connection = { url: env.REDIS_URL };

export const smsWorker = new Worker(
  "sms",
  async (job) => {
    logger.info("sms job", { id: job.id, name: job.name, data: job.data });
    // Integrate Twilio / MSG91 here — keep queue-only in dev
  },
  { connection },
);

smsWorker.on("failed", (job, err) => {
  logger.error("sms job failed", { id: job?.id, err: err.message });
});
