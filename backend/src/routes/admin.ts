/**
 * Admin routes - Latest Updates (home hero), etc.
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireAdmin, type AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);
router.use(requireAdmin);

const createUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(500),
  body: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

const updateSchema = createUpdateSchema.partial();

// List all latest updates
router.get('/latest-updates', async (_req: AuthRequest, res: Response) => {
  const updates = await prisma.latestUpdate.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });
  res.json({ updates });
});

// Create latest update
router.post('/latest-updates', async (req: AuthRequest, res: Response) => {
  const result = createUpdateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
  }
  const data = result.data;
  const update = await prisma.latestUpdate.create({
    data: {
      title: data.title,
      excerpt: data.excerpt,
      body: data.body || null,
      imageUrl: data.imageUrl || null,
      createdById: req.user!.userId,
    },
  });
  res.json(update);
});

// Update latest update
router.patch('/latest-updates/:id', async (req: AuthRequest, res: Response) => {
  const result = updateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
  }
  const { id } = req.params;
  const data = result.data;
  const update = await prisma.latestUpdate.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.excerpt && { excerpt: data.excerpt }),
      ...(data.body !== undefined && { body: data.body || null }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
    },
  });
  res.json(update);
});

// Delete latest update
router.delete('/latest-updates/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await prisma.latestUpdate.delete({ where: { id } });
  res.json({ success: true });
});

// ============ MEDIA (Gallery & Videos) ============

const createMediaSchema = z.object({
  type: z.enum(['gallery', 'video']),
  title: z.string().min(1).max(200),
  caption: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  videoUrl: z.string().url().optional().or(z.literal('')),
});

const updateMediaSchema = createMediaSchema.partial();

router.get('/media', async (req: AuthRequest, res: Response) => {
  const type = req.query.type as string | undefined;
  const where = type ? { type } : {};
  const items = await prisma.mediaItem.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({
    items: items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString() })),
  });
});

router.post('/media', async (req: AuthRequest, res: Response) => {
  const result = createMediaSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
  }
  const data = result.data;
  if (data.type === 'video' && !data.videoUrl) {
    return res.status(400).json({ error: 'Video URL required for video type' });
  }
  if (data.type === 'gallery' && !data.imageUrl) {
    return res.status(400).json({ error: 'Image URL required for gallery type' });
  }
  const item = await prisma.mediaItem.create({
    data: {
      type: data.type,
      title: data.title,
      caption: data.caption || null,
      imageUrl: data.imageUrl || null,
      videoUrl: data.videoUrl || null,
      createdById: req.user!.userId,
    },
  });
  res.json({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() });
});

router.patch('/media/:id', async (req: AuthRequest, res: Response) => {
  const result = updateMediaSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
  }
  const { id } = req.params;
  const data = result.data;
  const item = await prisma.mediaItem.update({
    where: { id },
    data: {
      ...(data.type && { type: data.type }),
      ...(data.title && { title: data.title }),
      ...(data.caption !== undefined && { caption: data.caption || null }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
      ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl || null }),
    },
  });
  res.json({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() });
});

router.delete('/media/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await prisma.mediaItem.delete({ where: { id } });
  res.json({ success: true });
});

// ============ HOMEPAGE STATS OVERRIDE ============

const statsOverrideSchema = z.object({
  totalReformers: z.number().int().min(0).optional(),
  states: z.number().int().min(0).optional(),
  districts: z.number().int().min(0).optional(),
  growthPercent: z.number().min(0).max(100).optional(),
  useOverride: z.boolean().optional(),
});

router.get('/homepage-stats-override', async (_req: AuthRequest, res: Response) => {
  const row = await prisma.homepageStatsOverride.upsert({
    where: { id: 1 },
    create: { id: 1, useOverride: false },
    update: {},
  });
  res.json({
    totalReformers: row.totalReformers,
    states: row.states,
    districts: row.districts,
    growthPercent: row.growthPercent?.toString(),
    useOverride: row.useOverride,
  });
});

router.patch('/homepage-stats-override', async (req: AuthRequest, res: Response) => {
  const result = statsOverrideSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
  }
  const data = result.data;
  const row = await prisma.homepageStatsOverride.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      totalReformers: data.totalReformers ?? null,
      states: data.states ?? null,
      districts: data.districts ?? null,
      growthPercent: data.growthPercent ?? null,
      useOverride: data.useOverride ?? false,
    },
    update: {
      ...(data.totalReformers !== undefined && { totalReformers: data.totalReformers }),
      ...(data.states !== undefined && { states: data.states }),
      ...(data.districts !== undefined && { districts: data.districts }),
      ...(data.growthPercent !== undefined && { growthPercent: data.growthPercent }),
      ...(data.useOverride !== undefined && { useOverride: data.useOverride }),
    },
  });
  res.json({
    totalReformers: row.totalReformers,
    states: row.states,
    districts: row.districts,
    growthPercent: row.growthPercent?.toString(),
    useOverride: row.useOverride,
  });
});

export default router;
