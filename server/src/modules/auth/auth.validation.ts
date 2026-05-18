import { z } from "zod";

const phoneSchema = z.string().min(8).max(20);

const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
      Number.isFinite(y) &&
      Number.isFinite(m) &&
      Number.isFinite(d) &&
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === m - 1 &&
      dt.getUTCDate() === d
    );
  }, "Invalid date");

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().min(4).max(12),
});

export const registerSchema = z.object({
  registerToken: z.string().min(10),
  phone: phoneSchema,
  fullName: z.string().min(2).max(150),
  email: z.string().email().optional().nullable(),
  password: z.string().min(8).max(128).optional().nullable(),
  referralCode: z.string().min(4).max(48).optional().nullable(),
  dob: isoDateString,
  gender: z.string().min(1).max(32),
  village: z.string().min(1).max(260),
  pincode: z.string().regex(/^\d{6}$/),
  occupation: z.string().min(1).max(120),
  education: z.string().min(1).max(120),
  stateName: z.string().min(1).max(120),
  districtName: z.string().min(1).max(120),
  blockName: z.string().min(1).max(120),
  stateId: z.string().uuid().optional().nullable(),
  districtId: z.string().uuid().optional().nullable(),
  blockId: z.string().uuid().optional().nullable(),
  boothId: z.string().uuid().optional().nullable(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

/** PATCH /auth/me — at least one field required */
export const updateProfileSchema = z
  .object({
    fullName: z.string().min(2).max(150).optional(),
    dob: isoDateString.optional(),
    gender: z.string().min(1).max(32).optional(),
    village: z.string().min(1).max(260).optional(),
    pincode: z.string().regex(/^\d{6}$/).optional(),
    occupation: z.string().min(1).max(120).optional(),
    education: z.string().min(1).max(120).optional(),
    stateName: z.string().min(1).max(120).optional(),
    districtName: z.string().min(1).max(120).optional(),
    blockName: z.string().min(1).max(120).optional(),
  })
  .strict()
  .refine((o) => Object.values(o).some((v) => v !== undefined), {
    message: "At least one field is required",
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
