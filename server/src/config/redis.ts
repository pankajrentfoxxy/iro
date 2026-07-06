import { Redis } from "ioredis";
import { env } from "./env.js";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export function getRedis(): Redis {
  if (!globalForRedis.redis) {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    client.on("error", (err) => {
      // Avoid ioredis "Unhandled error event" spam; callers still surface failed commands.
      console.error("[redis] connection error:", err.message);
    });
    globalForRedis.redis = client;
  }
  return globalForRedis.redis;
}
