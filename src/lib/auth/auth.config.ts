import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

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

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          nameAr: user.nameAr,
          image: user.avatarUrl,
          role: user.role,
          sectorId: user.sectorId,
          locale: user.locale,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id ?? "";
        token.role = (user as { role: UserRole }).role;
        token.sectorId = (user as { sectorId: string | null }).sectorId;
        token.name = user.name ?? token.name;
        token.nameAr = (user as { nameAr: string | null }).nameAr;
        token.locale = (user as { locale: string | null }).locale ?? "en";
      }
      if (trigger === "update" && session) {
        const s = session as {
          name?: string | null;
          nameAr?: string | null;
          locale?: string;
        };
        if (s.name !== undefined) token.name = s.name;
        if (s.nameAr !== undefined) token.nameAr = s.nameAr;
        if (s.locale !== undefined) token.locale = s.locale;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.sectorId = token.sectorId as string | null;
        session.user.name = (token.name as string | null | undefined) ?? session.user.name;
        session.user.nameAr = token.nameAr as string | null;
        session.user.locale = (token.locale as string | undefined) ?? "en";
      }
      return session;
    },
  },
});
