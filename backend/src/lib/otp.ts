import { redis } from './redis.js';

const OTP_EXPIRY = 600; // 10 minutes
const OTP_PREFIX = 'iro:otp:';
const OTP_RATE_PREFIX = 'iro:otp:rate:';

// In-memory fallback when Redis is unavailable (e.g. dev without Redis)
const memoryStore = new Map<string, { value: string; expiresAt: number }>();
const rateLimitStore = new Map<string, { count: number; expiresAt: number }>();
let useMemoryFallback = false;

async function redisAvailable(): Promise<boolean> {
  if (useMemoryFallback) return false;
  try {
    await redis.ping();
    return true;
  } catch {
    useMemoryFallback = true;
    console.warn('[OTP] Redis unavailable, using in-memory fallback. OTPs work but are lost on restart.');
    return false;
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOTP(phone: string, otp: string): Promise<void> {
  if (await redisAvailable()) {
    try {
      const key = `${OTP_PREFIX}${phone}`;
      await redis.setex(key, OTP_EXPIRY, otp);
      return;
    } catch (err) {
      console.warn('[OTP] Redis store failed, using memory:', err);
      useMemoryFallback = true;
    }
  }
  const key = `${OTP_PREFIX}${phone}`;
  memoryStore.set(key, { value: otp, expiresAt: Date.now() + OTP_EXPIRY * 1000 });
}

// Dev bypass: accept 123456 when ALLOW_DEV_OTP is set (for VPS/staging when SMS not configured)
const DEV_OTP = '123456';

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  const v = (process.env.ALLOW_DEV_OTP || '').trim().toLowerCase();
  const allowDevOtp = ['1', 'true', 'yes', 'on'].includes(v);
  if (allowDevOtp && otp === DEV_OTP) {
    return true;
  }
  if (process.env.NODE_ENV !== 'production' && otp === DEV_OTP) {
    return true;
  }
  if (!useMemoryFallback) {
    try {
      const key = `${OTP_PREFIX}${phone}`;
      const stored = await redis.get(key);
      if (!stored) return false;
      const valid = stored === otp;
      if (valid) await redis.del(key);
      return valid;
    } catch (err) {
      console.warn('[OTP] Redis verify failed, trying memory:', err);
      useMemoryFallback = true;
    }
  }
  const key = `${OTP_PREFIX}${phone}`;
  const entry = memoryStore.get(key);
  if (!entry || Date.now() > entry.expiresAt) return false;
  const valid = entry.value === otp;
  if (valid) memoryStore.delete(key);
  return valid;
}

export async function checkOTPRateLimit(phone: string): Promise<boolean> {
  if (!useMemoryFallback) {
    try {
      const key = `${OTP_RATE_PREFIX}${phone}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, 3600);
      return count <= 5;
    } catch (err) {
      console.warn('[OTP] Redis rate limit failed, using memory:', err);
      useMemoryFallback = true;
    }
  }
  const key = `${OTP_RATE_PREFIX}${phone}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry) {
    rateLimitStore.set(key, { count: 1, expiresAt: now + 3600 * 1000 });
    return true;
  }
  if (now > entry.expiresAt) {
    rateLimitStore.set(key, { count: 1, expiresAt: now + 3600 * 1000 });
    return true;
  }
  entry.count++;
  return entry.count <= 5;
}
