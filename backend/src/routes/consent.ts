/**
 * Consent tracking - GDPR/DND compliance
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

const updateSchema = z.object({
  status: z.enum(['GRANTED', 'REVOKED']),
});

router.patch('/', async (req: AuthRequest, res: Response) => {
  const parse = updateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid status', details: parse.error.flatten() });
  }

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      consentStatus: parse.data.status,
      consentTimestamp: new Date(),
    },
  });

  res.json({
    consentStatus: user.consentStatus,
    consentTimestamp: user.consentTimestamp,
  });
});

export default router;
