import type { Request, Response, NextFunction } from "express";
import { ok } from "../../lib/response.js";
import { hierarchyService } from "./hierarchy.service.js";

export async function getHierarchyChildren(req: Request, res: Response, next: NextFunction) {
  try {
    const parentId =
      typeof req.query.parentId === "string" && req.query.parentId.length > 0 ?
        req.query.parentId
      : null;
    const rows = await hierarchyService.children(parentId);
    ok(res, { locations: rows });
  } catch (e) {
    next(e);
  }
}
