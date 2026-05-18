import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { getRedis } from "../../config/redis.js";
import { ForbiddenError, UnauthorizedError, ValidationError } from "../../lib/errors.js";
import { hashPhone, maskPhoneTail, decryptPhone, newSessionId } from "../../lib/crypto.js";
import {
  signAdminAccessToken,
  signAdminRefreshToken,
  verifyAdminRefreshToken,
} from "../../lib/jwt.js";
import { canAccessAdminPanel } from "../../lib/rbac.js";

const refreshKey = (jti: string) => `admin:refresh:${jti}`;

function publicAdminUser(row: {
  id: string;
  fullName: string;
  phoneEncrypted: string;
  email: string | null;
  status: string;
  role: { levelCode: string; roleName: string } | null;
}) {
  let phoneMasked = "****";
  try {
    phoneMasked = maskPhoneTail(decryptPhone(row.phoneEncrypted));
  } catch {
    /* noop */
  }
  return {
    id: row.id,
    fullName: row.fullName,
    phoneMasked,
    email: row.email,
    status: row.status,
    roleLevel: row.role?.levelCode ?? null,
    roleName: row.role?.roleName ?? null,
  };
}

async function findUserForAdminLogin(identifier: string) {
  const trimmed = identifier.trim();
  const include = { role: { select: { id: true, levelCode: true, roleName: true } as const } };
  if (trimmed.includes("@")) {
    const email = trimmed.toLowerCase();
    return prisma.user.findUnique({ where: { email }, include });
  }
  const phoneHash = hashPhone(trimmed);
  return prisma.user.findUnique({ where: { phoneHash }, include });
}

export async function loginService(input: {
  identifier: string;
  password: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const user = await findUserForAdminLogin(input.identifier);
  if (!user?.passwordHash) {
    throw new ValidationError("Invalid credentials or password not set for this account");
  }
  const pwOk = await bcrypt.compare(input.password, user.passwordHash);
  if (!pwOk) throw new UnauthorizedError("Invalid credentials");

  if (!canAccessAdminPanel(user.role?.levelCode)) {
    throw new ForbiddenError("Volunteers and booth workers cannot access the admin console");
  }

  const sessionId = newSessionId();
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      method: "POST",
      path: "/auth/login",
      statusCode: 200,
      ip: input.ip ?? null,
      userAgent: input.userAgent?.slice(0, 512) ?? null,
      metadata: { sessionId, channel: "admin" },
    },
  });

  const jti = uuidv4();
  const redis = getRedis();
  await redis.set(refreshKey(jti), user.id, "EX", env.ADMIN_REFRESH_TTL_SECONDS);

  return {
    accessToken: signAdminAccessToken(user.id),
    refreshToken: signAdminRefreshToken(user.id, jti),
    expiresIn: env.ADMIN_JWT_ACCESS_EXPIRES_IN,
    user: publicAdminUser(user),
  };
}

export async function refreshService(refreshToken: string) {
  let payload;
  try {
    payload = verifyAdminRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Invalid refresh token");
  }
  const redis = getRedis();
  const userId = await redis.get(refreshKey(payload.jti));
  if (!userId || userId !== payload.sub) throw new UnauthorizedError("Refresh token revoked");

  await redis.del(refreshKey(payload.jti));

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { role: { select: { id: true, levelCode: true, roleName: true } } },
  });
  if (!user || user.status !== "ACTIVE") throw new UnauthorizedError();
  if (!canAccessAdminPanel(user.role?.levelCode)) throw new ForbiddenError();

  const jti = uuidv4();
  await redis.set(refreshKey(jti), user.id, "EX", env.ADMIN_REFRESH_TTL_SECONDS);

  return {
    accessToken: signAdminAccessToken(user.id),
    refreshToken: signAdminRefreshToken(user.id, jti),
    expiresIn: env.ADMIN_JWT_ACCESS_EXPIRES_IN,
    user: publicAdminUser(user),
  };
}

export async function logoutService(refreshToken: string | undefined) {
  if (!refreshToken) return { ok: true as const };
  try {
    const payload = verifyAdminRefreshToken(refreshToken);
    await getRedis().del(refreshKey(payload.jti));
  } catch {
    /* noop */
  }
  return { ok: true as const };
}

export async function meService(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { select: { id: true, levelCode: true, roleName: true } } },
  });
  if (!user) throw new UnauthorizedError();
  return {
    user: {
      ...publicAdminUser(user),
      jurisdiction: {
        stateId: user.stateId,
        districtId: user.districtId,
        blockId: user.blockId,
        boothId: user.boothId,
      },
    },
  };
}
