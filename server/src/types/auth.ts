import type { Role, User } from "@prisma/client";

export type AuthUser = Pick<User, "id" | "status" | "stateId" | "districtId" | "blockId" | "boothId"> & {
  role: Pick<Role, "id" | "levelCode" | "roleName"> | null;
};

export type JurisdictionScope = {
  stateId: string | null;
  districtId: string | null;
  blockId: string | null;
  boothId: string | null;
};
