import type { Request, Response, NextFunction } from "express";
import { ForbiddenError, ValidationError } from "../../lib/errors.js";
import { ok } from "../../lib/response.js";
import { boothsService } from "../booths/booths.service.js";

/** PRD: `GET /users?booth_id=my_booth` — reformers at viewer's booth. */
export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const boothIdParam = typeof req.query.booth_id === "string" ? req.query.booth_id : undefined;
    if (boothIdParam !== "my_booth") {
      throw new ValidationError('Use booth_id=my_booth');
    }
    const viewer = req.user!;
    if (!viewer.boothId) throw new ForbiddenError("No booth assigned to your profile");

    const users = await boothsService.listBoothReformers(viewer, viewer.boothId);
    ok(res, { users });
  } catch (e) {
    next(e);
  }
}
