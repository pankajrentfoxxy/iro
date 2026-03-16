import { Queue } from 'bullmq';
import { redis } from './redis.js';

export const SMS_QUEUE_NAME = 'iro-sms';
export const CAMPAIGN_QUEUE_NAME = 'iro-campaign';

export const smsQueue = new Queue(SMS_QUEUE_NAME, {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 1000 },
  },
});

export const campaignQueue = new Queue(CAMPAIGN_QUEUE_NAME, {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: { count: 500 },
  },
});
