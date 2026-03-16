/**
 * AES-256 encryption for sensitive data (phone numbers)
 * Uses AES-256-GCM for authenticated encryption
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error('ENCRYPTION_KEY must be set and at least 32 characters');
  }
  return scryptSync(secret, 'iro-salt', KEY_LENGTH);
}

export function encryptPhone(phone: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(phone, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decryptPhone(encryptedPhone: string): string {
  const key = getKey();
  const parts = encryptedPhone.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted phone format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}

export function hashForLookup(phone: string): string {
  const key = getKey();
  return scryptSync(phone, key.toString('hex').slice(0, 16), 16).toString('hex');
}
