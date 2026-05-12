import { Queue } from "bullmq";
import { env } from "./env.js";

const connection = { url: env.REDIS_URL };

export const smsQueue = new Queue("sms", { connection });
export const notificationQueue = new Queue("notification", { connection });
export const analyticsQueue = new Queue("analytics", { connection });
export const leadershipQueue = new Queue("leadership", { connection });
