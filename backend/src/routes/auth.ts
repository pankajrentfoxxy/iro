/**
 * Auth routes - OTP login, JWT, registration
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { encryptPhone, decryptPhone } from '../lib/crypto.js';
import { signToken } from '../lib/jwt.js';
import { generateOTP, storeOTP, verifyOTP, checkOTPRateLimit } from '../lib/otp.js';
import { generateReferralCode } from '../lib/referral.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { SignupSource } from '@prisma/client';
import { reverseGeocode } from '../lib/geocode.js';

const router = Router();

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile'),
});

const verifySchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6),
});

const registerSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/),
  name: z.string().min(2).max(100),
  email: z.string().email().optional().or(z.literal('')),
  age: z.number().min(1).max(120).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  referralCode: z.string().optional(),
});

const loginPasswordSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/),
  password: z.string().min(1),
});

const registerOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6),
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  tehsil: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  referralCode: z.string().optional(),
});

// Request OTP
router.post('/otp/request', async (req: Request, res: Response) => {
  const result = phoneSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid phone', details: result.error.flatten() });
  }

  const { phone } = result.data;
  const canSend = await checkOTPRateLimit(phone);
  if (!canSend) {
    return res.status(429).json({ error: 'Too many OTP requests. Try again later.' });
  }

  const otp = generateOTP();
  await storeOTP(phone, otp);

  // Log OTP when SMS not integrated (dev) or when ALLOW_DEV_OTP is set (staging/VPS testing)
  const allowDevOtp = process.env.ALLOW_DEV_OTP === '1' || process.env.ALLOW_DEV_OTP === 'true';
  if (process.env.NODE_ENV === 'development' || allowDevOtp) {
    console.log(`[OTP] For ${phone}: ${otp}`);
  }

  res.json({ success: true, message: 'OTP sent' });
});

// Verify OTP & Login
router.post('/otp/verify', async (req: Request, res: Response) => {
  const result = verifySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
  }

  const { phone, otp } = result.data;
  const valid = await verifyOTP(phone, otp);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }

  const encryptedPhone = encryptPhone(phone);
  let user = await prisma.user.findUnique({ where: { phone: encryptedPhone } });

  const initAdminPhone = process.env.INIT_ADMIN_PHONE;
  const isInitAdmin = initAdminPhone && phone === initAdminPhone.replace(/\D/g, '').slice(-10);

  if (!user) {
    const referralCode = generateReferralCode();
    user = await prisma.user.create({
      data: {
        phone: encryptedPhone,
        referralCode,
        signupSource: SignupSource.WEB,
        role: isInitAdmin ? 'NATIONAL_ADMIN' : 'MEMBER',
        isVerified: true,
      },
    });
    await prisma.analyticsUserScore.create({
      data: { userId: user.id, engagementScore: 1 },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        lastLoginAt: new Date(),
        ...(isInitAdmin && user.role === 'MEMBER' ? { role: 'NATIONAL_ADMIN' } : {}),
      },
    });
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
    state: user.state ?? undefined,
    district: user.district ?? undefined,
    tehsil: user.tehsil ?? undefined,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: phone.slice(0, 3) + '****' + phone.slice(-2),
      role: user.role,
      referralCode: user.referralCode,
    },
  });
});

// Register (password-based, no OTP)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }

    const { phone, name, email, age, password, referralCode } = result.data;
    const encryptedPhone = encryptPhone(phone);

    const existing = await prisma.user.findUnique({ where: { phone: encryptedPhone } });
    if (existing) {
      return res.status(400).json({ error: 'Phone number already registered. Use Login instead.' });
    }

    let referredById: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } });
      if (referrer) referredById = referrer.id;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const code = generateReferralCode();

    const user = await prisma.user.create({
      data: {
        phone: encryptedPhone,
        name,
        email: email || undefined,
        age: age || undefined,
        passwordHash,
        referralCode: code,
        referredById,
        signupSource: SignupSource.WEB,
        role: 'MEMBER',
        isVerified: false,
      },
    });
    await prisma.analyticsUserScore.create({
      data: { userId: user.id, engagementScore: 5 },
    });

    const token = signToken({
      userId: user.id,
      role: user.role,
      state: user.state ?? undefined,
      district: user.district ?? undefined,
      tehsil: user.tehsil ?? undefined,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        referralCode: user.referralCode,
        hasLocation: !!(user.latitude && user.longitude),
      },
    });
  } catch (err) {
    console.error('[Register] Error:', err);
    const msg = err instanceof Error ? err.message : '';
    const isDbError = /connect|ECONNREFUSED|relation|prisma|database/i.test(msg);
    res.status(500).json({
      error: isDbError
        ? 'Database connection failed. Check DATABASE_URL in .env and run: npm run db:migrate'
        : 'Registration failed. Please try again.',
    });
  }
});

// Login with password
router.post('/login', async (req: Request, res: Response) => {
  const result = loginPasswordSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
  }

  const { phone, password } = result.data;
  const encryptedPhone = encryptPhone(phone);

  const user = await prisma.user.findUnique({ where: { phone: encryptedPhone } });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid phone or password. Use OTP login if you have not set a password.' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid phone or password' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const initAdminPhone = process.env.INIT_ADMIN_PHONE;
  const isInitAdmin = initAdminPhone && phone === initAdminPhone.replace(/\D/g, '').slice(-10);
  if (isInitAdmin && user.role === 'MEMBER') {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'NATIONAL_ADMIN' },
    });
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
    state: user.state ?? undefined,
    district: user.district ?? undefined,
    tehsil: user.tehsil ?? undefined,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      referralCode: user.referralCode,
      hasLocation: !!(user.latitude && user.longitude),
    },
  });
});

// Register with OTP (alternative - for users who prefer OTP)
router.post('/register/otp', async (req: Request, res: Response) => {
  const result = registerOtpSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
  }

  const { phone, otp, name, email, state, district, tehsil, city, pincode, referralCode } = result.data;
  const valid = await verifyOTP(phone, otp);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }

  const encryptedPhone = encryptPhone(phone);
  let user = await prisma.user.findUnique({ where: { phone: encryptedPhone } });

  let referredById: string | null = null;
  if (referralCode) {
    const referrer = await prisma.user.findUnique({ where: { referralCode } });
    if (referrer) referredById = referrer.id;
  }

  if (!user) {
    const code = generateReferralCode();
    user = await prisma.user.create({
      data: {
        phone: encryptedPhone,
        name,
        email,
        state,
        district,
        tehsil,
        city,
        pincode,
        referralCode: code,
        referredById,
        signupSource: SignupSource.WEB,
        role: 'MEMBER',
        isVerified: true,
      },
    });
    await prisma.analyticsUserScore.create({
      data: { userId: user.id, engagementScore: 5 },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        state,
        district,
        tehsil,
        city,
        pincode,
        referredById: referredById ?? undefined,
        isVerified: true,
      },
    });
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
    state: user.state ?? undefined,
    district: user.district ?? undefined,
    tehsil: user.tehsil ?? undefined,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      referralCode: user.referralCode,
    },
  });
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      name: true,
      email: true,
      age: true,
      role: true,
      state: true,
      district: true,
      tehsil: true,
      city: true,
      area: true,
      pincode: true,
      latitude: true,
      longitude: true,
      referralCode: true,
      engagementScore: true,
      ideologyScore: true,
      consentStatus: true,
      createdAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Update location from lat/lng (reverse geocode)
const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

router.post('/me/location', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = locationSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid coordinates', details: result.error.flatten() });
  }

  const { latitude, longitude } = result.data;
  const userId = req.user!.userId;

  try {
    const geo = await reverseGeocode(latitude, longitude);
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        latitude,
        longitude,
        state: geo.state,
        district: geo.district,
        tehsil: geo.block,
        area: geo.village,
        city: geo.city || geo.village,
        pincode: geo.pincode,
      },
    });
    res.json({
      success: true,
      location: {
        state: user.state,
        district: user.district,
        block: user.tehsil,
        village: user.area,
        city: user.city,
        pincode: user.pincode,
      },
    });
  } catch (err) {
    console.error('Geocoding error:', err);
    res.status(500).json({ error: 'Could not resolve location' });
  }
});

// Update profile (optional fields)
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  age: z.number().min(1).max(120).optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  tehsil: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  pincode: z.string().optional(),
});

router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = updateProfileSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
  }

  const data = result.data;
  const updateData: Record<string, unknown> = {};
  if (data.name) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.age !== undefined) updateData.age = data.age;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.district !== undefined) updateData.district = data.district;
  if (data.tehsil !== undefined) updateData.tehsil = data.tehsil;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.area !== undefined) updateData.area = data.area;
  if (data.pincode !== undefined) updateData.pincode = data.pincode;

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: updateData,
  });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    age: user.age,
    state: user.state,
    district: user.district,
    tehsil: user.tehsil,
    city: user.city,
    area: user.area,
    pincode: user.pincode,
  });
});

export default router;
