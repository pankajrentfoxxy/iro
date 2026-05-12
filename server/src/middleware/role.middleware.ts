import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../lib/errors.js";

const ORDER: Record<string, number> = {
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
  L5: 5,
  L6: 6,
  L7: 7,
  L8: 8,
};

/** User must have one of these level codes (e.g. L1–L3). */
export function requireLevels(...allowed: string[]) {
  const set = new Set(allowed);
  return (req: Request, _res: Response, next: NextFunction) => {
    const code = req.user?.role?.levelCode;
    if (!code || !set.has(code)) {
      next(new ForbiddenError("Insufficient role"));
      return;
    }
    next();
  };
}

/** User level must be <= maxNumeric (L1 is strongest). */
export function requireMaxLevel(maxLevelCode: string) {
  const max = ORDER[maxLevelCode] ?? 99;
  return (req: Request, _res: Response, next: NextFunction) => {
    const code = req.user?.role?.levelCode;
    const cur = code ? (ORDER[code] ?? 99) : 99;
    if (cur > max) {
      next(new ForbiddenError("Insufficient role level"));
      return;
    }
    next();
  };
}

export function hierarchyRank(levelCode: string | undefined): number {
  if (!levelCode) return 99;
  return ORDER[levelCode] ?? 99;
}
