import type { DefaultSession, DefaultUser } from "next-auth";
import type { UserRole, SectorAccessLevel } from "@prisma/client";

export type SessionExtraSectorAccess = {
  sectorId: string;
  code: string;
  nameEn: string;
  nameAr: string | null;
  accessLevel: SectorAccessLevel;
};

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      sectorId: string | null;
      sectorCode: string | null;
      nameAr: string | null;
      locale: string;
      isActive: boolean;
      isSuspended: boolean;
      extraSectorAccess: SessionExtraSectorAccess[];
    };
  }
  interface User extends DefaultUser {
    role: UserRole;
    sectorId: string | null;
    sectorCode: string | null;
    nameAr: string | null;
    locale: string;
    isActive: boolean;
    isSuspended: boolean;
    extraSectorAccess: SessionExtraSectorAccess[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    sectorId: string | null;
    sectorCode: string | null;
    name?: string | null;
    nameAr: string | null;
    locale: string;
    isActive: boolean;
    isSuspended: boolean;
    extraSectorAccessJson: string;
  }
}
