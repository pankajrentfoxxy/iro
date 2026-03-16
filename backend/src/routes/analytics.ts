/**
 * Ideology & analytics - scoring, preferences, dashboards
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireAdmin, type AuthRequest } from '../middleware/auth.js';
import { withJurisdictionFilter } from '../middleware/jurisdiction.js';

const router = Router();

router.use(authMiddleware);

const preferenceSchema = z.object({
  topic: z.string().min(1).max(100),
  interestLevel: z.number().min(1).max(5),
  source: z.string().optional(),
});

// Member: Add ideology preference
router.post('/preferences', async (req: AuthRequest, res: Response) => {
  const parse = preferenceSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  const pref = await prisma.ideologyPreference.create({
    data: {
      userId: req.user!.userId,
      topic: parse.data.topic,
      interestLevel: parse.data.interestLevel,
      source: parse.data.source || 'interaction',
    },
  });

  res.json(pref);
});

// Admin: Analytics dashboard
router.get('/scores', requireAdmin, async (req: AuthRequest, res: Response) => {
  const jurisdiction = withJurisdictionFilter(req.user);

  const scores = await prisma.analyticsUserScore.findMany({
    where: {
      user: { ...jurisdiction, role: 'MEMBER' },
    },
    include: {
      user: {
        select: { id: true, name: true, state: true, district: true },
      },
    },
    orderBy: { engagementScore: 'desc' },
    take: 100,
  });

  res.json({ scores });
});

// Admin: Top influencers / volunteers
router.get('/influencers', requireAdmin, async (req: AuthRequest, res: Response) => {
  const jurisdiction = withJurisdictionFilter(req.user);

  const users = await prisma.user.findMany({
    where: { ...jurisdiction, role: 'MEMBER', engagementScore: { gte: 10 } },
    orderBy: { engagementScore: 'desc' },
    take: 50,
    select: {
      id: true,
      name: true,
      state: true,
      district: true,
      engagementScore: true,
      ideologyScore: true,
      referralCode: true,
    },
  });

  res.json({ influencers: users });
});

export default router;
