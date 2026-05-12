import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthUser } from "../types/auth.js";

export type AccessPayload = {
  sub: string;
  typ: "access";
};

export type RefreshPayload = {
  sub: string;
  typ: "refresh";
  jti: string;
};

export type RegisterPayload = {
  phoneHash: string;
  typ: "register";
};

const ISS = "iro-server";

const signOpts = (expiresIn: string): SignOptions =>
  ({ expiresIn: expiresIn as NonNullable<SignOptions["expiresIn"]>, issuer: ISS });

export function signAccessToken(userId: string) {
  return jwt.sign(
    { sub: userId, typ: "access" } satisfies AccessPayload,
    env.JWT_ACCESS_SECRET,
    signOpts(env.JWT_ACCESS_EXPIRES_IN),
  );
}

export function signRefreshToken(userId: string, jti: string) {
  return jwt.sign(
    { sub: userId, typ: "refresh", jti } satisfies RefreshPayload,
    env.JWT_REFRESH_SECRET,
    signOpts(env.JWT_REFRESH_EXPIRES_IN),
  );
}

export function signRegisterToken(phoneHash: string) {
  return jwt.sign(
    { phoneHash, typ: "register" } satisfies RegisterPayload,
    env.JWT_ACCESS_SECRET,
    signOpts(env.JWT_REGISTER_EXPIRES_IN),
  );
}

export function verifyAccessToken(token: string): AccessPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: ISS }) as AccessPayload;
  if (payload.typ !== "access") throw new Error("Invalid token type");
  return payload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: ISS }) as RefreshPayload;
  if (payload.typ !== "refresh") throw new Error("Invalid token type");
  return payload;
}

export function verifyRegisterToken(token: string): RegisterPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: ISS }) as RegisterPayload;
  if (payload.typ !== "register") throw new Error("Invalid token type");
  return payload;
}

/** Minimal safe projection for JWT auth middleware */
export function toAuthUser(row: {
  id: string;
  status: AuthUser["status"];
  stateId: string | null;
  districtId: string | null;
  blockId: string | null;
  boothId: string | null;
  role: { id: string; levelCode: string; roleName: string } | null;
}): AuthUser {
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
