import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLES = [
  { levelCode: "L1", roleName: "Party President", description: "National Party President" },
  { levelCode: "L2", roleName: "National Executive", description: "National Executive" },
  { levelCode: "L3", roleName: "State Leadership", description: "State Leadership" },
  { levelCode: "L4", roleName: "Regional Leader", description: "Regional Leader" },
  { levelCode: "L5", roleName: "District Leader", description: "District Leader" },
  { levelCode: "L6", roleName: "Block Leader", description: "Block Leader" },
  { levelCode: "L7", roleName: "Booth Worker", description: "Booth Worker" },
  { levelCode: "L8", roleName: "Volunteer", description: "Volunteer" },
] as const;

async function main() {
  for (const r of ROLES) {
    await prisma.role.upsert({
      where: { levelCode: r.levelCode },
      update: { roleName: r.roleName, description: r.description },
      create: {
        levelCode: r.levelCode,
        roleName: r.roleName,
        description: r.description,
      },
    });
  }

  const india = await prisma.hierarchyLocation.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      type: "COUNTRY",
      name: "India",
      parentId: null,
    },
  });

  await prisma.hierarchyLocation.upsert({
    where: { id: "00000000-0000-4000-8000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000002",
      type: "STATE",
      name: "Punjab",
      parentId: india.id,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
