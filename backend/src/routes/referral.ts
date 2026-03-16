/**
 * Referral engine - track referrals, leaderboard
 */

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/me', async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      referralCode: true,
      _count: { select: { referrals: true } },
      referrals: {
        select: { id: true, name: true, createdAt: true },
        take: 20,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    referralCode: user.referralCode,
    totalReferrals: user._count.referrals,
    recentReferrals: user.referrals,
  });
});

router.get('/leaderboard', async (req: AuthRequest, res: Response) => {
  const top = await prisma.user.findMany({
    where: { role: 'MEMBER' },
    select: {
      id: true,
      name: true,
      referralCode: true,
      _count: { select: { referrals: true } },
    },
    orderBy: { referrals: { _count: 'desc' } },
    take: 50,
  });
  res.json({
    leaderboard: top.map((u) => ({
      name: u.name || 'Anonymous',
      referralCount: u._count.referrals,
    })),
  });
});

export default router;
