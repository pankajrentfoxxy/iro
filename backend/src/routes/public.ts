/**
 * Public dashboard - no auth, aggregate stats only
*/

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const router = Router();

// ============ JOIN THE MOVEMENT — PUBLIC REGISTRATION ============

const registrationSchema = z.object({
  fullName: z.string().trim().max(120).optional().or(z.literal('')),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, 'Mobile number must be exactly 10 digits'),
  email: z.string().trim().email('Invalid email').max(160).optional().or(z.literal('')),
  age: z.union([z.string(), z.number()]).optional().or(z.literal('')),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional().or(z.literal('')),
  occupation: z.string().trim().max(120).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  state: z.string().trim().max(80).optional().or(z.literal('')),
  district: z.string().trim().max(80).optional().or(z.literal('')),
  pincode: z.string().trim().max(10).optional().or(z.literal('')),
  reason: z.string().trim().max(1000).optional().or(z.literal('')),
});

function parseOptionalAge(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

/** Empty optional text → null for DB; avoids stale-client "must not be null" on required fields */
function optionalText(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function generateMemberId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `IRO-${new Date().getFullYear()}-${suffix}`;
}

router.post('/registrations', async (req: Request, res: Response) => {
  try {
    const result = registrationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    const data = result.data;

    const existing = await prisma.registration.findUnique({ where: { mobile: data.mobile } });
    if (existing) {
      return res.status(409).json({
        error: 'This mobile number is already registered.',
        memberId: existing.memberId,
      });
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const registration = await prisma.registration.create({
          data: {
            memberId: generateMemberId(),
            fullName: optionalText(data.fullName),
            mobile: data.mobile,
            email: optionalText(data.email),
            age: parseOptionalAge(data.age),
            gender: optionalText(data.gender),
            occupation: optionalText(data.occupation),
            address: optionalText(data.address),
            state: optionalText(data.state) ?? '',
            district: optionalText(data.district) ?? '',
            pincode: optionalText(data.pincode),
            reason: optionalText(data.reason),
          },
        });
        return res.status(201).json({
          success: true,
          memberId: registration.memberId,
          fullName: registration.fullName,
        });
      } catch (err: unknown) {
        const code = (err as { code?: string }).code;
        if (code === 'P2002') {
          const target = String((err as { meta?: { target?: string[] } }).meta?.target ?? '');
          if (target.includes('mobile')) {
            return res.status(409).json({ error: 'This mobile number is already registered.' });
          }
          continue;
        }
        throw err;
      }
    }
    return res.status(500).json({ error: 'Could not generate a member ID, please try again.' });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again in a moment.' });
  }
});

router.get('/stats', async (_req: Request, res: Response) => {
  // Check homepage stats override first
  const override = await prisma.homepageStatsOverride.findUnique({
    where: { id: 1 },
  });
  if (override?.useOverride && override.totalReformers != null) {
    return res.json({
      totalMembers: override.totalReformers,
      stateCount: override.states ?? 0,
      districtCount: override.districts ?? 0,
      growthPercent: override.growthPercent?.toString() ?? '0',
      totalCampaigns: 0, // override doesn't include campaigns
      totalVolunteers: override.totalReformers,
      byState: [],
      byDistrict: [],
    });
  }

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
  { id: 'up-assembly-expansion', title: 'Groups in Every Assembly Constituency — Uttar Pradesh', excerpt: 'IRO announces a major expansion: dedicated groups will be formed in every assembly constituency across every district of Uttar Pradesh. Join us in building an empowered, organised society.', imageUrl: '/images/updates/up-assembly-expansion.png', publishedAt: new Date().toISOString() },
  { id: 'up-team-recruitment', title: 'IRO Needs Active Teams in Every District of UP', excerpt: 'We are building teams of 20–25 active members in every district of Uttar Pradesh. Take a step towards social reform — become part of this campaign for change. Contact: 9409889944 | 9409889955', imageUrl: '/images/updates/up-team-recruitment.png', publishedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'national-event', title: 'IRO National Event — Reforming Society Together', excerpt: 'Leaders and members of the Indian Reformers Organisation come together at a national gathering to strengthen the movement for transparent governance and citizen-led reform.', imageUrl: '/images/updates/national-event.png', publishedAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'movement-in-action', title: 'The Movement on the Ground', excerpt: 'From public rallies to grassroots outreach, IRO reformers are actively working across communities — raising voices, building awareness, and driving change at every level.', imageUrl: '/images/updates/movement-in-action.png', publishedAt: new Date(Date.now() - 259200000).toISOString() },
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
    const mapped = updates.map((u) => ({ ...u, publishedAt: u.publishedAt.toISOString() }));
    const hasImages = mapped.some((u) => u.imageUrl);
    const items = updates.length > 0 && hasImages ? mapped : LATEST_UPDATES_FALLBACK;
    return res.json({ updates: items });
  } catch {
    res.json({ updates: LATEST_UPDATES_FALLBACK });
  }
});

export default router;
