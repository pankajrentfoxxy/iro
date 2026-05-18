import { Queue } from "bullmq";
import { env } from "./env.js";

const connection = { url: env.REDIS_URL };

/** Async fan-out for segmented notifications / campaign delivery */
export const adminNotificationQueue = new Queue("iro-admin-notifications", {
  connection,
});
