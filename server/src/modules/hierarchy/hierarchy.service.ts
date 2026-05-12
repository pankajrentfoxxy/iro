import { prisma } from "../../config/db.js";

export class HierarchyService {
  async roots() {
    return prisma.hierarchyLocation.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
    });
  }

  async children(parentId: string | null) {
    return prisma.hierarchyLocation.findMany({
      where: parentId ? { parentId } : { parentId: null },
      orderBy: { name: "asc" },
    });
  }
}

export const hierarchyService = new HierarchyService();
