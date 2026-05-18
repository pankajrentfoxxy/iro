import type { NextFunction, Request, Response } from "express";
import { verifyAdminAccessToken, toAdminAuthUser } from "../lib/jwt.js";
import { UnauthorizedError } from "../lib/errors.js";
import { prisma } from "../config/db.js";

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedError();
    const token = header.slice("Bearer ".length);
    const payload = verifyAdminAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: { select: { id: true, levelCode: true, roleName: true } } },
    });
    if (!user || user.status !== "ACTIVE") throw new UnauthorizedError();
    req.user = toAdminAuthUser(user);
    next();
  } catch {
    next(new UnauthorizedError());
  }
}
