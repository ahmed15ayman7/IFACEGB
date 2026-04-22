import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import type { SessionExtraSectorAccess } from "@/types/next-auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function buildExtraSectorAccess(userId: string): Promise<SessionExtraSectorAccess[]> {
  const rows = await prisma.userSectorAccess.findMany({
    where: { userId },
    include: { sector: { select: { id: true, code: true, nameEn: true, nameAr: true, isActive: true } } },
  });
  return rows
    .filter((r) => r.sector.isActive)
    .map((r) => ({
      sectorId: r.sectorId,
      code: r.sector.code,
      nameEn: r.sector.nameEn,
      nameAr: r.sector.nameAr,
      accessLevel: r.accessLevel,
    }));
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            nameAr: true,
            avatarUrl: true,
            role: true,
            sectorId: true,
            isActive: true,
            isSuspended: true,
            passwordHash: true,
            locale: true,
          },
        });

        if (!user || !user.passwordHash) return null;
        if (!user.isActive || user.isSuspended) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // Fetch sector code if applicable
        let sectorCode: string | null = null;
        if (user.sectorId) {
          const sector = await prisma.sector.findUnique({
            where: { id: user.sectorId },
            select: { code: true },
          });
          sectorCode = sector?.code ?? null;
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        const extraSectorAccess = await buildExtraSectorAccess(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          nameAr: user.nameAr,
          image: user.avatarUrl,
          role: user.role,
          sectorId: user.sectorId,
          sectorCode,
          locale: user.locale,
          isActive: user.isActive,
          isSuspended: user.isSuspended,
          extraSectorAccess,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Legacy tokens before this release
      if (token.extraSectorAccessJson == null) token.extraSectorAccessJson = "[]";
      if (token.isActive == null) token.isActive = true;
      if (token.isSuspended == null) token.isSuspended = false;
      if (user) {
        const u = user as {
          id: string;
          role: UserRole;
          sectorId: string | null;
          sectorCode: string | null;
          nameAr: string | null;
          locale: string | null;
          isActive: boolean;
          isSuspended: boolean;
          extraSectorAccess: SessionExtraSectorAccess[];
        };
        token.id = u.id;
        token.role = u.role;
        token.sectorId = u.sectorId;
        token.sectorCode = u.sectorCode;
        token.name = user.name ?? token.name;
        token.nameAr = u.nameAr;
        token.locale = u.locale ?? "en";
        token.isActive = u.isActive;
        token.isSuspended = u.isSuspended;
        token.extraSectorAccessJson = JSON.stringify(u.extraSectorAccess ?? []);
      }
      if (trigger === "update" && session) {
        const s = session as {
          name?: string | null;
          nameAr?: string | null;
          locale?: string;
          /** Set true to refresh flags + sector access from database */
          refreshUser?: boolean;
        };
        if (s.name !== undefined) token.name = s.name;
        if (s.nameAr !== undefined) token.nameAr = s.nameAr;
        if (s.locale !== undefined) token.locale = s.locale;
        if (s.refreshUser && token.id) {
          const row = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isActive: true, isSuspended: true },
          });
          if (row) {
            token.isActive = row.isActive;
            token.isSuspended = row.isSuspended;
          }
          const extra = await buildExtraSectorAccess(token.id as string);
          token.extraSectorAccessJson = JSON.stringify(extra);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.sectorId = token.sectorId as string | null;
        session.user.sectorCode = token.sectorCode as string | null;
        session.user.name = (token.name as string | null | undefined) ?? session.user.name;
        session.user.nameAr = token.nameAr as string | null;
        session.user.locale = (token.locale as string | undefined) ?? "en";
        session.user.isActive = token.isActive !== false;
        session.user.isSuspended = token.isSuspended === true;
        try {
          session.user.extraSectorAccess = JSON.parse(
            (token.extraSectorAccessJson as string) || "[]"
          ) as SessionExtraSectorAccess[];
        } catch {
          session.user.extraSectorAccess = [];
        }
      }
      return session;
    },
  },
});
