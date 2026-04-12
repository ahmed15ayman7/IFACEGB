import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth/auth.config";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATTERNS = [
  /\/[a-z]{2}\/dashboard/,
  /\/[a-z]{2}\/god-view/,
  /\/[a-z]{2}\/admin/,
  /\/[a-z]{2}\/sector\//,
  /\/[a-z]{2}\/employee/,
  /\/[a-z]{2}\/exam\//,
];

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

  // Check if route needs auth
  const needsAuth = PROTECTED_PATTERNS.some((p) => p.test(pathname));
  if (needsAuth) {
    const session = await auth();
    if (!session?.user) {
      const locale = pathname.split("/")[1] || "en";
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));
    }

    // God View RBAC
    if (pathname.includes("/god-view") && session.user.role !== "super_admin") {
      const locale = pathname.split("/")[1] || "en";
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
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
