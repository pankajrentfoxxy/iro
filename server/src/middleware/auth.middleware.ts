import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken, toAuthUser } from "../lib/jwt.js";
import { UnauthorizedError } from "../lib/errors.js";
import { userRepository } from "../modules/users/user.repository.js";

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedError();
    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    const user = await userRepository.findById(payload.sub);
    if (!user || user.status !== "ACTIVE") throw new UnauthorizedError();
    req.user = toAuthUser({
      id: user.id,
      status: user.status,
      stateId: user.stateId,
      districtId: user.districtId,
      blockId: user.blockId,
      boothId: user.boothId,
      role: user.role,
    });
    req.jurisdiction = {
      stateId: user.stateId,
      districtId: user.districtId,
      blockId: user.blockId,
      boothId: user.boothId,
    };
    next();
  } catch (error) {
    console.log("AUTH ERROR =>", error);
    next(new UnauthorizedError());
  }
}
