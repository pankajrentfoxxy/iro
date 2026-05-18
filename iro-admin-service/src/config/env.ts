import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { z } from "zod";
import { aes256KeyBase64Schema } from "../lib/aesKeyEnv.js";

/**
 * Load env when admin service lives next to `server/` (`iro/iro-admin-service`).
 * 1. `../server/.env` — shared DATABASE_URL, REDIS_URL, AES key (same as main API).
 * 2. `./.env` — overrides/adds ADMIN_JWT_*, PORT, CORS_ORIGIN, etc.
 */
const cwd = resolve(process.cwd());
const serverEnvPath = resolve(cwd, "../server/.env");
const dotEnvPath = resolve(cwd, ".env");
const examplePath = resolve(cwd, ".env.example");

if (existsSync(serverEnvPath)) {
  config({ path: serverEnvPath });
}
if (existsSync(dotEnvPath)) {
  config({ path: dotEnvPath, override: true });
} else if (existsSync(examplePath)) {
  config({ path: examplePath });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4010),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  ADMIN_JWT_ACCESS_SECRET: z.string().min(32),
  ADMIN_JWT_REFRESH_SECRET: z.string().min(32),
  ADMIN_JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  ADMIN_JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  ADMIN_REFRESH_TTL_SECONDS: z.coerce.number().default(60 * 60 * 24 * 7),

  AES_256_KEY_BASE64: aes256KeyBase64Schema,
  CORS_ORIGIN: z.string().default("*"),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("[iro-admin-service] Invalid environment:", result.error.flatten().fieldErrors);
    console.error(
      "[iro-admin-service] Tip: use ../server/.env for DATABASE_URL, REDIS_URL, AES_256_KEY_BASE64; " +
        "set ADMIN_JWT_ACCESS_SECRET and ADMIN_JWT_REFRESH_SECRET (32+ chars) in ../server/.env or ./.env",
    );
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
