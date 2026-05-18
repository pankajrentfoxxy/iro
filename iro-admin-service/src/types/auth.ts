import type { Role, User } from "@prisma/client";

export type AdminAuthUser = Pick<User, "id" | "status" | "stateId" | "districtId" | "blockId" | "boothId"> & {
  role: Pick<Role, "id" | "levelCode" | "roleName"> | null;
};
