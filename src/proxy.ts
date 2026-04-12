import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";

const intlMiddleware = createMiddleware(routing);

/** Locale-prefixed app areas that require a session. Intentionally excludes /{locale}/auth/* (login, register, etc.). */
const PROTECTED_PATTERNS = [
  /\/[a-z]{2}\/dashboard(?:\/|$)/,
  /\/[a-z]{2}\/god-view(?:\/|$)/,
  /\/[a-z]{2}\/admin(?:\/|$)/,
  /\/[a-z]{2}\/sector(?:\/|$)/,
  /\/[a-z]{2}\/employee(?:\/|$)/,
  /\/[a-z]{2}\/exam(?:\/|$)/,
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

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.match(/\.(png|jpg|svg|ico|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // Kill switch check via Redis flag header (set by API route)
  const killSwitchActive = req.headers.get("x-kill-switch") === "1";
  if (killSwitchActive && !KILL_SWITCH_EXEMPT.some((p) => pathname.startsWith(p))) {
    return new NextResponse("Service temporarily suspended. Contact admin.", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const needsAuth = pathRequiresAuth(pathname);
  if (needsAuth) {
    const session = await auth();
    if (!session?.user) {
      const locale = pathname.split("/")[1] || "en";
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));
    }

    // God View RBAC — send to role home in one step (avoid /dashboard → /employee → … loops)
    if (pathname.includes("/god-view") && session.user.role !== "super_admin") {
      const locale = pathname.split("/")[1] || "en";
      const home = getRoleHomePath(
        locale,
        session.user.role as UserRole,
        session.user.sectorId ?? null,
      );
      return NextResponse.redirect(new URL(home, req.url));
    }
  }

  // Off-hours access logging for API routes
  if (pathname.startsWith("/api/") && !KILL_SWITCH_EXEMPT.some((p) => pathname.startsWith(p))) {
    const hour = new Date().getHours();
    const isOffHours = hour < 7 || hour >= 22;
    if (isOffHours) {
      // Log will be handled by API route itself
      req.headers.set("x-off-hours", "1");
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|.*\\.woff2?).*)",
  ],
};
