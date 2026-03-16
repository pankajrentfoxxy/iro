/**
 * User management - CRUD with jurisdiction filtering
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireAdmin, type AuthRequest } from '../middleware/auth.js';
import { withJurisdictionFilter } from '../middleware/jurisdiction.js';

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  state: z.string().optional(),
  district: z.string().optional(),
  tehsil: z.string().optional(),
  search: z.string().optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const parse = querySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid query', details: parse.error.flatten() });
  }

  const { page, limit, state, district, tehsil, search } = parse.data;
  const jurisdiction = withJurisdictionFilter(req.user);
  const where: Record<string, unknown> = { ...jurisdiction, role: 'MEMBER' };

  if (state) where.state = state;
  if (district) where.district = district;
  if (tehsil) where.tehsil = tehsil;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        state: true,
        district: true,
        tehsil: true,
        city: true,
        engagementScore: true,
        ideologyScore: true,
        referralCode: true,
        signupSource: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

router.get('/stats', async (req: AuthRequest, res: Response) => {
  const jurisdiction = withJurisdictionFilter(req.user);

  const [total, byState, byDistrict] = await Promise.all([
    prisma.user.count({ where: { ...jurisdiction, role: 'MEMBER' } }),
    prisma.user.groupBy({
      by: ['state'],
      where: { ...jurisdiction, role: 'MEMBER', state: { not: null } },
      _count: { id: true },
    }),
    prisma.user.groupBy({
      by: ['state', 'district'],
      where: { ...jurisdiction, role: 'MEMBER', district: { not: null } },
      _count: { id: true },
    }),
  ]);

  res.json({
    total,
    byState: byState.map((s) => ({ state: s.state, count: s._count.id })),
    byDistrict: byDistrict.map((d) => ({
      state: d.state,
      district: d.district,
      count: d._count.id,
    })),
  });
});

export default router;
