import { z } from "zod";

export const createReferralInviteSchema = z.object({
  targetRoleLevel: z
    .string()
    .trim()
    .regex(/^L[1-8]$/i, "Invalid role level"),
  maxUses: z.coerce.number().int().min(1).max(10_000).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export type CreateReferralInviteInput = z.infer<typeof createReferralInviteSchema>;
