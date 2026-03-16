/**
 * Campaign management - Bulk SMS, targeting, queue
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { campaignQueue } from '../lib/queue.js';
import { authMiddleware, requireAdmin, type AuthRequest } from '../middleware/auth.js';
import { withJurisdictionFilter } from '../middleware/jurisdiction.js';
import { CampaignType } from '@prisma/client';

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  targetState: z.string().optional(),
  targetDistrict: z.string().optional(),
  targetTehsil: z.string().optional(),
  campaignType: z.nativeEnum(CampaignType),
  messageContent: z.string().min(1).max(1600),
  minEngagementScore: z.number().min(0).optional(),
  minIdeologyScore: z.number().optional(),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  const data = parse.data;
  const jurisdiction = withJurisdictionFilter(req.user);

  const where: Record<string, unknown> = {
    ...jurisdiction,
    role: 'MEMBER',
    OR: [{ consentStatus: 'GRANTED' }, { consentStatus: 'PENDING' }],
  };
  if (data.targetState) where.state = data.targetState;
  if (data.targetDistrict) where.district = data.targetDistrict;
  if (data.targetTehsil) where.tehsil = data.targetTehsil;
  if (data.minEngagementScore !== undefined) {
    where.engagementScore = { gte: data.minEngagementScore };
  }
  if (data.minIdeologyScore !== undefined) {
    where.ideologyScore = { gte: data.minIdeologyScore };
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, phone: true },
  });

  const campaign = await prisma.campaign.create({
    data: {
      title: data.title,
      description: data.description,
      targetState: data.targetState,
      targetDistrict: data.targetDistrict,
      targetTehsil: data.targetTehsil,
      campaignType: data.campaignType,
      messageContent: data.messageContent,
      createdById: req.user!.userId,
      status: 'scheduled',
    },
  });

  // Add opt-out link for DND compliance
  const optOutSuffix = '\n\nReply STOP to opt-out.';
  const message = (data.messageContent + optOutSuffix).slice(0, 1600);

  for (const user of users) {
    await prisma.bulkSmsQueue.create({
      data: {
        campaignId: campaign.id,
        userId: user.id,
        phone: user.phone,
        status: 'pending',
        scheduledAt: new Date(),
      },
    });
  }

  // Push to Redis queue for worker processing
  await campaignQueue.add(
    'process-campaign',
    { campaignId: campaign.id },
    { jobId: campaign.id }
  );

  res.status(201).json({
    campaign: {
      id: campaign.id,
      title: campaign.title,
      status: campaign.status,
      targetCount: users.length,
    },
  });
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const campaigns = await prisma.campaign.findMany({
    where: { createdById: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      _count: { select: { campaignLogs: true, bulkSmsQueue: true } },
    },
  });
  res.json({ campaigns });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: req.params.id },
    include: {
      campaignLogs: { take: 100, orderBy: { timestamp: 'desc' } },
      _count: { select: { bulkSmsQueue: true } },
    },
  });
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json(campaign);
});

export default router;
