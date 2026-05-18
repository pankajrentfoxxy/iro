import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AdminAuthUser } from "../types/auth.js";

export type AdminAccessPayload = { sub: string; typ: "admin_access" };
export type AdminRefreshPayload = { sub: string; typ: "admin_refresh"; jti: string };

const ISS = "iro-admin-service";

const signOpts = (expiresIn: string): SignOptions =>
  ({ expiresIn: expiresIn as NonNullable<SignOptions["expiresIn"]>, issuer: ISS });

export function signAdminAccessToken(userId: string) {
  return jwt.sign({ sub: userId, typ: "admin_access" } satisfies AdminAccessPayload, env.ADMIN_JWT_ACCESS_SECRET, signOpts(env.ADMIN_JWT_ACCESS_EXPIRES_IN));
}

export function signAdminRefreshToken(userId: string, jti: string) {
  return jwt.sign({ sub: userId, typ: "admin_refresh", jti } satisfies AdminRefreshPayload, env.ADMIN_JWT_REFRESH_SECRET, signOpts(env.ADMIN_JWT_REFRESH_EXPIRES_IN));
}

export function verifyAdminAccessToken(token: string): AdminAccessPayload {
  const payload = jwt.verify(token, env.ADMIN_JWT_ACCESS_SECRET, { issuer: ISS }) as AdminAccessPayload;
  if (payload.typ !== "admin_access") throw new Error("Invalid token type");
  return payload;
}

export function verifyAdminRefreshToken(token: string): AdminRefreshPayload {
  const payload = jwt.verify(token, env.ADMIN_JWT_REFRESH_SECRET, { issuer: ISS }) as AdminRefreshPayload;
  if (payload.typ !== "admin_refresh") throw new Error("Invalid token type");
  return payload;
}

export function toAdminAuthUser(row: {
  id: string;
  status: AdminAuthUser["status"];
  stateId: string | null;
  districtId: string | null;
  blockId: string | null;
  boothId: string | null;
  role: { id: string; levelCode: string; roleName: string } | null;
}): AdminAuthUser {
  return {
    id: row.id,
    status: row.status,
    stateId: row.stateId,
    districtId: row.districtId,
    blockId: row.blockId,
    boothId: row.boothId,
    role: row.role,
  };
}
