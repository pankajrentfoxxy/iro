/**
 * Webhook routes - MyOperator / Tollfree missed call capture
 * WhatsApp Cloud API webhook (test/verification)
 * Includes signature verification for security
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { encryptPhone } from '../lib/crypto.js';
import { generateReferralCode } from '../lib/referral.js';
import { SignupSource } from '@prisma/client';
import crypto from 'crypto';

const router = Router();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return true; // Skip in dev
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

const missedCallSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile'),
  caller_id: z.string().optional(),
  timestamp: z.string().optional(),
  // MyOperator format may vary - adjust as per provider docs
});

router.post('/missed-call', async (req: Request, res: Response) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const rawBody = JSON.stringify(req.body);

  if (WEBHOOK_SECRET && !verifyWebhookSignature(rawBody, signature || '')) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const parseResult = missedCallSchema.safeParse({
    phone: req.body.phone || req.body.caller_id || req.body.from,
    caller_id: req.body.caller_id,
    timestamp: req.body.timestamp,
  });

  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.flatten() });
  }

  const { phone } = parseResult.data;
  const normalizedPhone = phone.startsWith('+91') ? phone.slice(3).trim() : phone.replace(/\D/g, '').slice(-10);

  try {
    const encryptedPhone = encryptPhone(normalizedPhone);

    let user = await prisma.user.findUnique({
      where: { phone: encryptedPhone },
    });

    if (!user) {
      const referralCode = generateReferralCode();
      user = await prisma.user.create({
        data: {
          phone: encryptedPhone,
          referralCode,
          signupSource: SignupSource.MISSED_CALL,
          role: 'MEMBER',
        },
      });

      await prisma.analyticsUserScore.create({
        data: {
          userId: user.id,
          engagementScore: 1,
        },
      });
    }

    await prisma.missedCall.create({
      data: {
        phone: encryptedPhone,
        userId: user.id,
        source: 'myoperator',
        rawPayload: req.body,
        processedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Missed call captured',
      userId: user.id,
    });
  } catch (err) {
    console.error('Missed call webhook error:', err);
    res.status(500).json({ error: 'Processing failed' });
  }
});

// ============ WhatsApp Cloud API Webhook ============
// Meta requires this for webhook verification and receiving messages
// Configure in Meta Developer Console: https://developers.facebook.com/

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'iro_whatsapp_verify';

// GET - Webhook verification (Meta sends this when you add the webhook URL)
router.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    console.log('[WhatsApp] Webhook verified');
    return res.status(200).send(challenge);
  }
  res.status(403).send('Forbidden');
});

// POST - Receive WhatsApp webhook events (messages, status updates)
router.post('/whatsapp', (req: Request, res: Response) => {
  // Meta requires 200 OK quickly - process async
  res.status(200).send('EVENT_RECEIVED');

  const body = req.body;
  if (body.object !== 'whatsapp_business_account') return;

  try {
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === 'messages') {
          const value = change.value;
          const messages = value?.messages || [];
          for (const msg of messages) {
            const from = msg.from;
            const type = msg.type;
            const text = msg.text?.body || '';
            console.log(`[WhatsApp] From ${from} (${type}): ${text.slice(0, 50)}...`);
            // TODO: Handle incoming messages, trigger flows, etc.
          }
        }
      }
    }
  } catch (err) {
    console.error('[WhatsApp] Webhook parse error:', err);
  }
});

export default router;
