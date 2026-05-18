import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { z } from "zod";
import { aes256KeyBase64Schema } from "../lib/aesKeyEnv.js";

const root = resolve(process.cwd());
const dotEnvPath = resolve(root, ".env");
const examplePath = resolve(root, ".env.example");

if (existsSync(dotEnvPath)) {
  config({ path: dotEnvPath });
} else if (process.env.NODE_ENV !== "production") {
  if (existsSync(examplePath)) {
    config({ path: examplePath });
    console.warn(
      "[iro-server] No .env file found — loaded .env.example. Copy it to .env and adjust secrets for real use.",
    );
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  JWT_REGISTER_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TTL_SECONDS: z.coerce.number().default(60 * 60 * 24 * 7),

  AES_256_KEY_BASE64: aes256KeyBase64Schema,
  OTP_EXPIRY_SECONDS: z.coerce.number().default(300),
  OTP_LENGTH: z.coerce.number().min(4).max(8).default(6),

  CORS_ORIGIN: z.string().default("*"),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error(
      "[iro-server] Invalid or missing environment variables. Create a .env file (copy from .env.example).",
    );
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env: Env = parseEnv();
