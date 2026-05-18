import { createRequire } from "node:module";
import { env } from "./env.js";

const require = createRequire(import.meta.url);

/** ioredis default export is not typed cleanly under NodeNext + ESM; concrete instance type is unnecessary here. */
type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: string, ttl: number): Promise<unknown>;
  del(...keys: string[]): Promise<unknown>;
};

let redis: RedisLike | null = null;

export function getRedis(): RedisLike {
  if (!redis) {
    const IORedis = require("ioredis") as new (url: string, opts?: { maxRetriesPerRequest: unknown }) => RedisLike;
    redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  }
  return redis;
}
