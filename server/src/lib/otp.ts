import { randomInt } from "node:crypto";
import type { Redis } from "ioredis";
import { env } from "../config/env.js";
import { hashPhone } from "./crypto.js";

const PREFIX = "otp:";

function codeKey(phoneHash: string) {
  return `${PREFIX}${phoneHash}`;
}

export function generateOtp(): string {
  const n = env.OTP_LENGTH;
  const max = 10 ** n - 1;
  const min = 10 ** (n - 1);
  return String(randomInt(min, max + 1));
}

export async function storeOtp(redis: Redis, phone: string, code: string): Promise<void> {
  const key = codeKey(hashPhone(phone));
  await redis.set(key, code, "EX", env.OTP_EXPIRY_SECONDS);
}

export async function getStoredOtp(redis: Redis, phone: string): Promise<string | null> {
  const key = codeKey(hashPhone(phone));
  return redis.get(key);
}

/** Remove OTP after verification path has succeeded past infra checks (e.g. DB reachable). */
export async function clearStoredOtp(redis: Redis, phone: string): Promise<void> {
  await redis.del(codeKey(hashPhone(phone)));
}
