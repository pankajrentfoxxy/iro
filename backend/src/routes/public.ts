/**
 * Public dashboard - no auth, aggregate stats only
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/stats', async (_req: Request, res: Response) => {
  const [
    totalMembers,
    stateCount,
    districtCount,
    totalCampaigns,
    prevMonthMembers,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'MEMBER' } }),
    prisma.user.groupBy({
      by: ['state'],
      where: { role: 'MEMBER', state: { not: null } },
      _count: { id: true },
    }),
    prisma.user.groupBy({
      by: ['state', 'district'],
      where: { role: 'MEMBER', district: { not: null } },
      _count: { id: true },
    }),
    prisma.campaign.count(),
    prisma.user.count({
      where: {
        role: 'MEMBER',
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const growthPercent =
    prevMonthMembers > 0
      ? (((totalMembers - prevMonthMembers) / prevMonthMembers) * 100).toFixed(1)
      : '0';

  // Normalize state names for map display (e.g. "NCT of Delhi" -> "Delhi")
  const STATE_NORMALIZE: Record<string, string> = {
    'NCT of Delhi': 'Delhi',
    'National Capital Territory of Delhi': 'Delhi',
    'Dadra and Nagar Haveli and Daman and Diu': 'Dadra and Nagar Haveli', // map to dn for display
  };
  const byStateRaw = stateCount.map((s) => ({
    state: s.state,
    count: s._count.id,
  }));
  const byStateMerged = new Map<string, number>();
  for (const { state, count } of byStateRaw) {
    const normalized = state ? (STATE_NORMALIZE[state] || state) : null;
    if (normalized) {
      byStateMerged.set(normalized, (byStateMerged.get(normalized) || 0) + count);
    }
  }
  const byState = Array.from(byStateMerged.entries()).map(([state, count]) => ({ state, count }));

  res.json({
    totalMembers,
    stateCount: byState.length,
    districtCount: new Set(districtCount.map((d) => d.district)).size,
    growthPercent: String(growthPercent),
    totalCampaigns,
    totalVolunteers: totalMembers,
    byState,
    byDistrict: districtCount.map((d) => ({
      state: d.state!,
      district: d.district!,
      count: d._count.id,
    })),
  });
});

// District-level stats for state drill-down
router.get('/stats/districts', async (req: Request, res: Response) => {
  const state = req.query.state as string;
  if (!state) {
    return res.status(400).json({ error: 'State parameter required' });
  }
  // Query both canonical and alternate names (e.g. Delhi + NCT of Delhi)
  const STATE_ALIASES: Record<string, string[]> = {
    Delhi: ['Delhi', 'NCT of Delhi', 'National Capital Territory of Delhi'],
  };
  const stateVariants = STATE_ALIASES[state] || [state];

  const byDistrict = await prisma.user.groupBy({
    by: ['district'],
    where: {
      role: 'MEMBER',
      state: { in: stateVariants },
      district: { not: null },
    },
    _count: { id: true },
  });

  res.json({
    state,
    districts: byDistrict.map((d) => ({
      district: d.district,
      count: d._count.id,
    })),
  });
});

// Public campaigns list (no auth, limited fields)
router.get('/campaigns', async (_req: Request, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { status: { in: ['scheduled', 'running', 'completed'] } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        description: true,
        campaignType: true,
        status: true,
        targetState: true,
        createdAt: true,
      },
    });
    return res.json({
      campaigns: campaigns.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch {
    res.json({ campaigns: [] });
  }
});

// Fallback when DB has no updates (before seed runs)
const LATEST_UPDATES_FALLBACK = [
  { id: '1', title: 'Welcome to Indian Reform Organisation', excerpt: 'Reforming India, Together. Join the movement and be part of citizen-led change across every state and district.', imageUrl: null, publishedAt: new Date().toISOString() },
  { id: '2', title: 'IRO Expands to 25 States', excerpt: 'Our network of reformers now spans 25 states and union territories. Volunteers are driving change at the grassroots level.', imageUrl: null, publishedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', title: 'Youth Engagement Programme Launched', excerpt: 'New initiative to engage young reformers through digital campaigns and campus outreach programmes.', imageUrl: null, publishedAt: new Date(Date.now() - 172800000).toISOString() },
  { id: '4', title: 'District-Level Reformer Meetups', excerpt: 'Monthly meetups are being organized in districts to strengthen local networks and share best practices.', imageUrl: null, publishedAt: new Date(Date.now() - 259200000).toISOString() },
  { id: '5', title: 'Transparency in Governance – Our Mission', excerpt: 'IRO advocates for greater transparency in government processes and citizen participation in decision-making.', imageUrl: null, publishedAt: new Date(Date.now() - 345600000).toISOString() },
];

// Public gallery (photos)
router.get('/media/gallery', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.mediaItem.findMany({
      where: { type: 'gallery' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, title: true, caption: true, imageUrl: true, createdAt: true },
    });
    return res.json({
      items: items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })),
    });
  } catch {
    res.json({ items: [] });
  }
});

// Public videos (YouTube/Vimeo embeds)
router.get('/media/videos', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.mediaItem.findMany({
      where: { type: 'video' },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, title: true, caption: true, imageUrl: true, videoUrl: true, createdAt: true },
    });
    return res.json({
      items: items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })),
    });
  } catch {
    res.json({ items: [] });
  }
});

// Latest updates for hero section (up to 10 for carousel)
router.get('/latest-updates', async (_req: Request, res: Response) => {
  try {
    const updates = await prisma.latestUpdate.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 10,
      select: { id: true, title: true, excerpt: true, imageUrl: true, publishedAt: true },
    });
    const items = updates.length > 0
      ? updates.map((u) => ({ ...u, publishedAt: u.publishedAt.toISOString() }))
      : LATEST_UPDATES_FALLBACK;
    return res.json({ updates: items });
  } catch {
    res.json({ updates: LATEST_UPDATES_FALLBACK });
  }
});

export default router;
