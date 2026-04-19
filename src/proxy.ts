import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

const intlMiddleware = createMiddleware(routing);

// ─── Kill-switch status cache (single fetch → global + sectors) ──────────────
// The cache lives in the Edge worker memory — shared across requests in the same
// Vercel region/instance. TTL = 30 s; acceptable staleness for an ops toggle.

type KillStatus = {
  globalActive: boolean;
  lockedSectors: Set<string>;
};

let _ksCache: { status: KillStatus; ts: number } | null = null;
const KS_TTL = 30_000; // 30 seconds

async function getKillStatus(baseUrl: string): Promise<KillStatus> {
  const now = Date.now();
  if (_ksCache && now - _ksCache.ts < KS_TTL) return _ksCache.status;

  try {
    const res = await fetch(`${baseUrl}/api/kill-switch`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as {
        active?: boolean;
        lockedSectors?: string[];
      };
      const status: KillStatus = {
        globalActive: data.active ?? false,
        lockedSectors: new Set<string>(data.lockedSectors ?? []),
      };
      _ksCache = { status, ts: now };
      return status;
    }
  } catch {
    // network error — return cached or safe default
  }
  return _ksCache?.status ?? { globalActive: false, lockedSectors: new Set() };
}

// ─── Routes that should never be blocked ─────────────────────────────────────
const KS_EXEMPT_PREFIXES = ["/api/auth", "/api/kill-switch", "/api/health", "/_next"];

function isKsExempt(pathname: string): boolean {
  return KS_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
}

// ─── Auth-protected route patterns ────────────────────────────────────────────
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
  /\/[a-z]{2}\/isr(?:\/|$)/,
];

function isLocaleAuthRoute(pathname: string): boolean {
  return /^\/[a-z]{2}\/auth(?:\/|$)/.test(pathname);
}

function pathRequiresAuth(pathname: string): boolean {
  if (isLocaleAuthRoute(pathname)) return false;
  return PROTECTED_PATTERNS.some((p) => p.test(pathname));
}

// ─── 503 HTML helpers ─────────────────────────────────────────────────────────
function make503(locale: string, variant: "platform" | "sector", sectorCode?: string): NextResponse {
  const isAr = locale === "ar";
  const titleText = variant === "platform"
    ? (isAr ? "الخدمة متوقفة مؤقتاً" : "Service Temporarily Suspended")
    : (isAr ? "هذا القطاع موقوف مؤقتاً" : "Sector Temporarily Suspended");
  const bodyText = variant === "platform"
    ? (isAr ? "تم إيقاف المنصة مؤقتاً من قِبل الإدارة. يرجى التواصل مع الدعم." : "The platform has been temporarily suspended by an administrator. Please contact support.")
    : (isAr ? "تم إيقاف الوصول لهذا القطاع من قِبل مسؤول النظام. يرجى التواصل مع الدعم." : "Access to this sector has been temporarily suspended by a system administrator. Please contact support.");

  const html = `<!doctype html><html lang="${locale}" dir="${isAr ? "rtl" : "ltr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titleText}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#060f1e;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem}
  .card{text-align:center;max-width:480px}
  .icon{width:64px;height:64px;border-radius:16px;background:rgba(156,42,42,.15);border:1px solid rgba(156,42,42,.4);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:28px}
  h1{font-size:1.5rem;font-weight:700;margin-bottom:.6rem}
  p{color:#6e7d93;font-size:.9rem;line-height:1.6;margin-bottom:1.8rem}
  .badge{display:inline-flex;align-items:center;gap:.5rem;padding:.4rem 1rem;border-radius:999px;background:rgba(156,42,42,.15);border:1px solid rgba(156,42,42,.4);color:#ef4444;font-size:.75rem;font-weight:600;margin-bottom:1.5rem}
  .dot{width:8px;height:8px;border-radius:50%;background:#ef4444;animation:pulse 1.5s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  a{display:inline-block;padding:.6rem 1.4rem;border-radius:10px;background:linear-gradient(135deg,#C9A227,#e8c547);color:#060f1e;font-weight:600;font-size:.85rem;text-decoration:none}
  .code{font-family:monospace;font-size:.7rem;color:#6e7d93;margin-top:1.5rem;opacity:.6}
</style></head>
<body>
  <div class="card">
    <div class="icon">🔒</div>
    <div class="badge"><span class="dot"></span>${isAr ? "موقوف" : "Suspended"}</div>
    <h1>${titleText}</h1>
    <p>${bodyText}</p>
    <a href="/${locale}">${isAr ? "العودة للرئيسية" : "Back to home"}</a>
    ${sectorCode ? `<p class="code">sector: ${sectorCode}</p>` : ""}
  </div>
</body></html>`;

  return new NextResponse(html, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "300" },
  });
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 1. Static files & Next.js internals — pass through immediately
  if (
    pathname.startsWith("/_next") ||
    pathname.match(/\.(png|jpe?g|svg|ico|webp|woff2?|css|js\.map)$/)
  ) {
    return NextResponse.next();
  }

  // 2. API routes — pass through (but enforce global kill switch)
  if (pathname.startsWith("/api/")) {
    if (!isKsExempt(pathname)) {
      const ks = await getKillStatus(req.nextUrl.origin);
      if (ks.globalActive) {
        return new NextResponse("Service temporarily suspended.", {
          status: 503,
          headers: { "Content-Type": "text/plain", "Retry-After": "300" },
        });
      }
    }
    return NextResponse.next();
  }

  const locale = pathname.split("/")[1] || "en";

  // 3. Fetch kill-switch status (one cached call covers both global + sectors)
  const ks = await getKillStatus(req.nextUrl.origin);

  // 4. Global kill switch — block everything that's not exempt
  if (ks.globalActive && !isKsExempt(pathname)) {
    return make503(locale, "platform");
  }

  // 5. Per-sector lock — matches /{locale}/sector/{code} and all sub-routes
  const sectorMatch = pathname.match(/^\/[a-z]{2}\/sector\/([^/]+)/);
  if (sectorMatch) {
    const sectorCode = sectorMatch[1];
    if (ks.lockedSectors.has(sectorCode)) {
      return make503(locale, "sector", sectorCode);
    }
  }

  // 6. Auth guard
  if (pathRequiresAuth(pathname)) {
    const token = authSecret ? await getToken({ req, secret: authSecret }) : null;
    if (!token) {
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));
    }

    const role = token.role as UserRole | undefined;
    const sectorId = (token.sectorId as string | null | undefined) ?? null;

    if (pathname.includes("/god-view") && role !== "super_admin") {
      if (!role) return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));
      return NextResponse.redirect(new URL(getRoleHomePath(locale, role, sectorId), req.url));
    }
  }

  // 7. Locale routing
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|.*\\.woff2?).*)",
  ],
};
