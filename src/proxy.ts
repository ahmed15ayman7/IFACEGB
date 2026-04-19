import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

const intlMiddleware = createMiddleware(routing);

// ─── Sector lock cache (Edge-safe, refreshes every 30s) ──────────────────────
let _sectorLockCache: { codes: Set<string>; ts: number } | null = null;
const SECTOR_LOCK_TTL = 30_000; // 30 seconds

async function getLockedSectorCodes(baseUrl: string): Promise<Set<string>> {
  const now = Date.now();
  if (_sectorLockCache && now - _sectorLockCache.ts < SECTOR_LOCK_TTL) {
    return _sectorLockCache.codes;
  }
  try {
    const res = await fetch(`${baseUrl}/api/kill-switch?check=sectors`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json() as { lockedSectors?: string[] };
      const codes = new Set<string>(data.lockedSectors ?? []);
      _sectorLockCache = { codes, ts: now };
      return codes;
    }
  } catch {}
  return _sectorLockCache?.codes ?? new Set();
}

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

  // ── Per-sector lock check ────────────────────────────────────────────────
  // Matches  /{locale}/sector/{code}  and  /{locale}/sector/{code}/**
  const sectorRouteMatch = pathname.match(/^\/[a-z]{2}\/sector\/([^/]+)/);
  if (sectorRouteMatch) {
    const sectorCode = sectorRouteMatch[1];
    try {
      const baseUrl = req.nextUrl.origin;
      const lockedCodes = await getLockedSectorCodes(baseUrl);
      if (lockedCodes.has(sectorCode)) {
        const locale = pathname.split("/")[1] || "en";
        const html = `<!doctype html><html lang="${locale}" dir="${locale === "ar" ? "rtl" : "ltr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${locale === "ar" ? "القطاع موقوف مؤقتاً" : "Sector Suspended"}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#060f1e;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem}
  .card{text-align:center;max-width:480px}
  .icon{width:64px;height:64px;border-radius:16px;background:rgba(156,42,42,.15);border:1px solid rgba(156,42,42,.4);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:28px}
  h1{font-size:1.6rem;font-weight:700;margin-bottom:.6rem}
  p{color:#6e7d93;font-size:.9rem;line-height:1.6;margin-bottom:1.8rem}
  .badge{display:inline-flex;align-items:center;gap:.5rem;padding:.4rem 1rem;border-radius:999px;background:rgba(156,42,42,.15);border:1px solid rgba(156,42,42,.4);color:#9C2A2A;font-size:.75rem;font-weight:600;margin-bottom:1.5rem}
  .dot{width:8px;height:8px;border-radius:50%;background:#9C2A2A;animation:pulse 1.5s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  a{display:inline-block;padding:.6rem 1.4rem;border-radius:10px;background:linear-gradient(135deg,#C9A227,#e8c547);color:#060f1e;font-weight:600;font-size:.85rem;text-decoration:none}
  .code{font-family:monospace;font-size:.7rem;color:#6e7d93;margin-top:1.5rem;opacity:.6}
</style></head>
<body>
  <div class="card">
    <div class="icon">🔒</div>
    <div class="badge"><span class="dot"></span>${locale === "ar" ? "موقوف مؤقتاً" : "Suspended"}</div>
    <h1>${locale === "ar" ? "هذا القطاع موقوف مؤقتاً" : "This sector is currently suspended"}</h1>
    <p>${locale === "ar" ? "تم إيقاف الوصول لهذا القطاع مؤقتاً من قِبل مسؤول النظام. يرجى التواصل مع الدعم." : "Access to this sector has been temporarily suspended by a system administrator. Please contact support."}</p>
    <a href="/${locale}">${locale === "ar" ? "العودة للرئيسية" : "Back to home"}</a>
    <p class="code">sector: ${sectorCode}</p>
  </div>
</body></html>`;
        return new NextResponse(html, {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    } catch {}
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
