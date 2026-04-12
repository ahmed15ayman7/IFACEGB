import type { DefaultSession, DefaultUser } from "next-auth";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      sectorId: string | null;
      nameAr: string | null;
      locale: string;
    };
  }
  interface User extends DefaultUser {
    role: UserRole;
    sectorId: string | null;
    nameAr: string | null;
    locale: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    sectorId: string | null;
    name?: string | null;
    nameAr: string | null;
    locale: string;
  }
}
