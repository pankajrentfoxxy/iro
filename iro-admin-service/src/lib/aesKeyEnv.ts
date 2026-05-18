import { Buffer } from "node:buffer";
import { z } from "zod";

/** Normalizes dashboard/env formatting mistakes (leading newline, spaces). */
export function normalizeAes256KeyBase64Input(raw: string): string {
  return raw.trim().replace(/\s/g, "");
}

/**
 * AES-256-GCM needs exactly 32 raw bytes. Paste failures often include stray whitespace.
 * Generate: `openssl rand -base64 32` — same value on main API + admin API.
 */
export const aes256KeyBase64Schema = z
  .string()
  .transform(normalizeAes256KeyBase64Input)
  .superRefine((s, ctx) => {
    if (!s.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AES_256_KEY_BASE64 is empty after trimming.",
      });
      return;
    }
    const buf = Buffer.from(s, "base64");
    if (buf.length !== 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `AES_256_KEY_BASE64 must decode to exactly 32 bytes (decoded ${buf.length}). Use openssl rand -base64 32 and paste without quotes or line breaks.`,
      });
    }
  });
