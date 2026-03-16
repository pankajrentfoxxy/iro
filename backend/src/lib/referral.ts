import { nanoid } from 'nanoid';

const REFERRAL_LENGTH = 8;
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars

export function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < REFERRAL_LENGTH; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
}
