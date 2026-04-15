import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

const intlMiddleware = createMiddleware(routing);

/** Locale-prefixed app areas that require a session. Intentionally excludes /{locale}/auth/* (login, register, etc.). */
const PROTECTED_PATTERNS = [
  /\/[a-z]{2}\/dashboard(?:\/|$)/,
  /\/[a-z]{2}\/god-view(?:\/|$)/,
  /\/[a-z]{2}\/admin(?:\/|$)/,
  /\/[a-z]{2}\/sector(?:\/|$)/,
  /\/[a-z]{2}\/employee(?:\/|$)/,
  /\/[a-z]{2}\/exam(?:\/|$)/,
  /\/[a-z]{2}\/settings(?:\/|$)/,
  /\/[a-z]{2}\/lms(?:\/|$)/,
  /\/[a-z]{2}\/connect(?:\/|$)/,
  /\/[a-z]{2}\/franchise(?:\/|$)/,
];

function isLocaleAuthRoute(pathname: string): boolean {
  return /^\/[a-z]{2}\/auth(?:\/|$)/.test(pathname);
}

function pathRequiresAuth(pathname: string): boolean {
  if (isLocaleAuthRoute(pathname)) return false;
  return PROTECTED_PATTERNS.some((p) => p.test(pathname));
}

const KILL_SWITCH_EXEMPT = [
  "/api/auth",
  "/api/kill-switch",
  "/api/health",
];

export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Allow static files and Next.js internals immediately
  if (pathname.startsWith("/_next") || pathname.match(/\.(png|jpg|svg|ico|woff2?)$/)) {
    return NextResponse.next();
  }

  // Handle API routes: apply Kill Switch + off-hours header, then pass through (no locale prefix)
  if (pathname.startsWith("/api/")) {
    const killSwitchActive = req.headers.get("x-kill-switch") === "1";
    if (killSwitchActive && !KILL_SWITCH_EXEMPT.some((p) => pathname.startsWith(p))) {
      return new NextResponse("Service temporarily suspended. Contact admin.", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      });
    }
    const hour = new Date().getHours();
    if ((hour < 7 || hour >= 22) && !KILL_SWITCH_EXEMPT.some((p) => pathname.startsWith(p))) {
      req.headers.set("x-off-hours", "1");
    }
    return NextResponse.next();
  }

  // Kill switch check for non-API routes
  const killSwitchActive = req.headers.get("x-kill-switch") === "1";
  if (killSwitchActive && !KILL_SWITCH_EXEMPT.some((p) => pathname.startsWith(p))) {
    return new NextResponse("Service temporarily suspended. Contact admin.", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const needsAuth = pathRequiresAuth(pathname);
  if (needsAuth) {
    // Use JWT from the request (Edge-safe). `auth()` without args relies on `headers()` and is unreliable in proxy/middleware.
    const token = authSecret
      ? await getToken({ req, secret: authSecret })
      : null;

    if (!token) {
      const locale = pathname.split("/")[1] || "en";
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));
    }

    const role = token.role as UserRole | undefined;
    const sectorId = (token.sectorId as string | null | undefined) ?? null;

    if (pathname.includes("/god-view") && role !== "super_admin") {
      const locale = pathname.split("/")[1] || "en";
      if (!role) {
        return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));
      }
      const home = getRoleHomePath(locale, role, sectorId);
      return NextResponse.redirect(new URL(home, req.url));
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|.*\\.woff2?).*)",
  ],
};
