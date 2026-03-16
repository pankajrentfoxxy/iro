import { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.js';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';

/**
 * Filters query results to admin's jurisdiction
 * National sees all, State sees state, District sees district, Tehsil sees tehsil
 */
export function withJurisdictionFilter(user: AuthRequest['user']) {
  if (!user) return {};
  
  switch (user.role) {
    case Role.NATIONAL_ADMIN:
      return {};
    case Role.STATE_ADMIN:
      return user.state ? { state: user.state } : {};
    case Role.DISTRICT_ADMIN:
      return user.state && user.district
        ? { state: user.state, district: user.district }
        : {};
    case Role.TEHSIL_ADMIN:
      return user.state && user.district && user.tehsil
        ? { state: user.state, district: user.district, tehsil: user.tehsil }
        : {};
    case Role.BOOTH_COORDINATOR:
      return user.state && user.district && user.tehsil
        ? { state: user.state, district: user.district, tehsil: user.tehsil }
        : {};
    default:
      return {};
  }
}

export async function canAccessUser(
  adminId: string,
  targetUserId: string
): Promise<boolean> {
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true, state: true, district: true, tehsil: true },
  });
  if (!admin) return false;

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { state: true, district: true, tehsil: true },
  });
  if (!target) return false;

  switch (admin.role) {
    case Role.NATIONAL_ADMIN:
      return true;
    case Role.STATE_ADMIN:
      return admin.state === target.state;
    case Role.DISTRICT_ADMIN:
      return admin.state === target.state && admin.district === target.district;
    case Role.TEHSIL_ADMIN:
    case Role.BOOTH_COORDINATOR:
      return (
        admin.state === target.state &&
        admin.district === target.district &&
        admin.tehsil === target.tehsil
      );
    default:
      return false;
  }
}
