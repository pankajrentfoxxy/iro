import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { env } from "../config/env.js";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;

function getKey(): Buffer {
  const raw = Buffer.from(env.AES_256_KEY_BASE64, "base64");
  if (raw.length !== 32) {
    throw new Error("AES_256_KEY_BASE64 must decode to 32 bytes");
  }
  return raw;
}

/** Single base64 payload: iv + ciphertext + authTag */
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
  if (buf.length < IV_LEN + AUTH_TAG_LEN + 1) {
    throw new Error("Invalid ciphertext");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(buf.length - AUTH_TAG_LEN);
  const enc = buf.subarray(IV_LEN, buf.length - AUTH_TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

/** Deterministic HMAC-SHA256 hex for lookup (pepper derived from AES key) */
export function hashPhone(phone: string): string {
  const normalized = phone.replace(/\s+/g, "").trim();
  const salt = getKey().subarray(0, 16);
  const h = createHmac("sha256", salt);
  h.update(normalized);
  return h.digest("hex");
}
