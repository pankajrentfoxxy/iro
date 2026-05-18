import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { env } from "../config/env.js";
import { normalizeAes256KeyBase64Input } from "./aesKeyEnv.js";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;

function getKey(): Buffer {
  const b64 = normalizeAes256KeyBase64Input(env.AES_256_KEY_BASE64);
  const raw = Buffer.from(b64, "base64");
  if (raw.length !== 32) {
    throw new Error(
      `AES_256_KEY_BASE64 decodes to ${raw.length} bytes (need 32). Use \`openssl rand -base64 32\` — identical on main + admin API.`,
    );
  }
  return raw;
}

/** Same convention as main API — iv + ciphertext + authTag as base64 */
export function encryptPhone(plain: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]).toString("base64");
}

export function decryptPhone(payloadB64: string): string {
  const key = getKey();
  const buf = Buffer.from(payloadB64, "base64");
  if (buf.length < IV_LEN + AUTH_TAG_LEN + 1) throw new Error("Invalid ciphertext");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(buf.length - AUTH_TAG_LEN);
  const enc = buf.subarray(IV_LEN, buf.length - AUTH_TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

/** Same convention as main API — deterministic lookup hash */
export function hashPhone(phone: string): string {
  const normalized = phone.replace(/\s+/g, "").trim();
  const salt = getKey().subarray(0, 16);
  const h = createHmac("sha256", salt);
  h.update(normalized);
  return h.digest("hex");
}

export function maskPhoneTail(plain: string): string {
  const d = plain.replace(/\D/g, "");
  if (d.length < 4) return "****";
  return `******${d.slice(-4)}`;
}

/** Generate opaque session id for audit trail */
export function newSessionId(): string {
  return randomBytes(16).toString("hex");
}
