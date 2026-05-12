import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { prisma } from "../../config/db.js";
import { ok } from "../../lib/response.js";

const r = Router();
r.use(authMiddleware);
r.get("/", async (req, res, next) => {
  try {
    const parentId =
      typeof req.query.parentId === "string" && req.query.parentId.length > 0 ?
        req.query.parentId
      : null;
    const booths = await prisma.hierarchyLocation.findMany({
      where: parentId ? { parentId, type: "BOOTH" } : { type: "BOOTH" },
      take: 200,
      orderBy: { name: "asc" },
    });
    ok(res, { booths });
  } catch (e) {
    next(e);
  }
});

export const boothsRouter = r;
