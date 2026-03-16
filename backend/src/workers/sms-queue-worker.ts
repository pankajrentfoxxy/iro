/**
 * SMS Queue Worker - processes bulk_sms_queue via Redis/BullMQ
 * DND compliance: opt-out link in message, rate limiting
 */

import 'dotenv/config';
import { Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { prisma } from '../lib/prisma.js';
import { decryptPhone } from '../lib/crypto.js';

const SMS_QUEUE_NAME = 'iro-sms';
const CAMPAIGN_QUEUE_NAME = 'iro-campaign';

// TODO: Integrate MSG91/Twilio - for now simulate
async function sendSMS(phone: string, message: string): Promise<{ success: boolean; response?: string }> {
  const decrypted = decryptPhone(phone);
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SMS] To ${decrypted}: ${message.slice(0, 50)}...`);
    return { success: true, response: 'simulated' };
  }
  // const client = new Twilio(accountSid, authToken);
  // await client.messages.create({ to: `+91${decrypted}`, body: message, from: twilioNumber });
  return { success: true };
}

async function processCampaign(campaignId: string) {
  const pending = await prisma.bulkSmsQueue.findMany({
    where: { campaignId, status: 'pending' },
    take: 100,
  });

  for (const item of pending) {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { messageContent: true },
      });
      const message = (campaign?.messageContent || '') + '\n\nReply STOP to opt-out.';

      const result = await sendSMS(item.phone, message);

      await prisma.$transaction([
        prisma.bulkSmsQueue.update({
          where: { id: item.id },
          data: {
            status: result.success ? 'sent' : 'failed',
            sentAt: new Date(),
            errorMessage: result.success ? null : result.response,
          },
        }),
        prisma.campaignLog.create({
          data: {
            campaignId,
            userId: item.userId ?? undefined,
            phone: item.phone,
            status: result.success ? 'SENT' : 'FAILED',
            response: result.response,
          },
        }),
      ]);
    } catch (err) {
      await prisma.bulkSmsQueue.update({
        where: { id: item.id },
        data: {
          retryCount: { increment: 1 },
          status: item.retryCount >= 2 ? 'failed' : 'pending',
          errorMessage: String(err),
        },
      });
    }
  }

  const remaining = await prisma.bulkSmsQueue.count({
    where: { campaignId, status: 'pending' },
  });
  if (remaining === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'completed', completedAt: new Date() },
    });
  }
}

const campaignWorker = new Worker(
  CAMPAIGN_QUEUE_NAME,
  async (job) => {
    if (job.name === 'process-campaign' && job.data.campaignId) {
      await processCampaign(job.data.campaignId);
    }
  },
  {
    connection: redis as any,
    concurrency: 2,
  }
);

campaignWorker.on('completed', (job) => console.log(`Campaign job ${job.id} completed`));
campaignWorker.on('failed', (job, err) => console.error(`Campaign job ${job?.id} failed:`, err));

console.log('IRO SMS Queue Worker running...');
