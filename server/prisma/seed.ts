import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { encryptPhone, hashPhone } from "../src/lib/crypto.js";

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

  const pulseQuestions = [
    {
      id: "q1",
      kind: "rating",
      label: "How motivated do you feel about outreach today?",
      max: 5,
    },
    {
      id: "q2",
      kind: "text",
      label: "One message you'd share with a new Reformer",
      placeholder: "Short Hindi / English line…",
    },
  ];

  await prisma.questionnaire.upsert({
    where: { id: "00000000-0000-4000-8000-00000000feed" },
    update: {
      title: "Weekly pulse",
      questions: pulseQuestions,
      targetRoleLevel: null,
      isActive: true,
      xpReward: 75,
    },
    create: {
      id: "00000000-0000-4000-8000-00000000feed",
      title: "Weekly pulse",
      type: "PULSE",
      questions: pulseQuestions,
      targetRoleLevel: null,
      xpReward: 75,
      isActive: true,
    },
  });

  /** Dev bootstrap admin — change password in production. Login: admin@rentfoxxy.com / admin@123 */
  const ADMIN_USER_ID = "00000000-0000-4000-8000-00000000ad01";
  const ADMIN_EMAIL = "admin@rentfoxxy.com";
  const ADMIN_PHONE_PLACEHOLDER = "+919999999001";
  const l1 = await prisma.role.findUnique({ where: { levelCode: "L1" } });
  if (!l1) throw new Error("Seed: L1 role missing");
  const passwordHash = await bcrypt.hash("admin@123", 10);
  const phoneEncrypted = encryptPhone(ADMIN_PHONE_PLACEHOLDER);
  const phoneHash = hashPhone(ADMIN_PHONE_PLACEHOLDER);

  await prisma.user.upsert({
    where: { id: ADMIN_USER_ID },
    update: {
      email: ADMIN_EMAIL,
      fullName: "RentFoxxy Admin",
      phoneEncrypted,
      phoneHash,
      passwordHash,
      roleId: l1.id,
      status: "ACTIVE",
    },
    create: {
      id: ADMIN_USER_ID,
      fullName: "RentFoxxy Admin",
      email: ADMIN_EMAIL,
      phoneEncrypted,
      phoneHash,
      passwordHash,
      referralCode: "SEEDADMRFXXY",
      roleId: l1.id,
      status: "ACTIVE",
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
