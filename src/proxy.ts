import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

const intlMiddleware = createMiddleware(routing);

// ─── Kill-switch status cache ─────────────────────────────────────────────────
// One fetch per 30 s covers: global on/off + locked sector codes + locked sector IDs
// The cache lives in Edge worker memory (per Vercel region instance).

type KillStatus = {
  globalActive: boolean;
  lockedSectorCodes: Set<string>; // match URL path segments like /sector/training
  lockedSectorIds: Set<string>;   // match JWT token.sectorId (UUID)
};

let _ksCache: { status: KillStatus; ts: number } | null = null;
const KS_TTL = 30_000; // 30 seconds

async function getKillStatus(origin: string): Promise<KillStatus> {
  const now = Date.now();
  if (_ksCache && now - _ksCache.ts < KS_TTL) return _ksCache.status;

  try {
    const res = await fetch(`${origin}/api/kill-switch`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as {
        active?: boolean;
        lockedSectors?: string[];
        lockedSectorIds?: string[];
      };
      const status: KillStatus = {
        globalActive: data.active ?? false,
        lockedSectorCodes: new Set<string>(data.lockedSectors ?? []),
        lockedSectorIds: new Set<string>(data.lockedSectorIds ?? []),
      };
      _ksCache = { status, ts: now };
      return status;
    }
  } catch {
    // network / fetch error — use stale cache or safe default
  }
  return _ksCache?.status ?? {
    globalActive: false,
    lockedSectorCodes: new Set(),
    lockedSectorIds: new Set(),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Routes that are never blocked, even during kill-switch
const KS_EXEMPT_PREFIXES = ["/api/auth", "/api/kill-switch", "/api/health", "/_next"];

function isKsExempt(pathname: string): boolean {
  return KS_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
}

// Roles that bypass the sector lock (they manage the system)
const SECTOR_LOCK_BYPASS_ROLES: UserRole[] = ["super_admin", "admin"];

// Auth-protected route patterns (locale-prefixed)
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
  /\/[a-z]{2}\/trainer(?:\/|$)/,
  /\/[a-z]{2}\/center(?:\/|$)/,
  /\/[a-z]{2}\/client(?:\/|$)/,
  /\/[a-z]{2}\/user(?:\/|$)/,
  /\/[a-z]{2}\/general-admin(?:\/|$)/,
];

function isLocaleAuthRoute(pathname: string): boolean {
  return /^\/[a-z]{2}\/auth(?:\/|$)/.test(pathname);
}

function pathRequiresAuth(pathname: string): boolean {
  if (isLocaleAuthRoute(pathname)) return false;
  return PROTECTED_PATTERNS.some((p) => p.test(pathname));
}

// ─── 503 HTML ─────────────────────────────────────────────────────────────────

function make503(
  locale: string,
  variant: "platform" | "sector",
  ref?: string
): NextResponse {
  const isAr = locale === "ar";

  const title =
    variant === "platform"
      ? (isAr ? "الخدمة متوقفة مؤقتاً" : "Service Temporarily Suspended")
      : (isAr ? "قطاعك موقوف مؤقتاً" : "Your Sector Is Suspended");

  const body =
    variant === "platform"
      ? (isAr
          ? "تم إيقاف المنصة مؤقتاً من قِبل الإدارة. يرجى التواصل مع الدعم."
          : "The platform has been temporarily suspended by an administrator. Please contact support.")
      : (isAr
          ? "تم إيقاف الوصول لقطاعك مؤقتاً من قِبل مسؤول النظام. لا يمكنك تسجيل الدخول أو استخدام أي خدمات تابعة لهذا القطاع حتى إشعار آخر."
          : "Your sector has been temporarily suspended by a system administrator. You cannot log in or use any sector services until further notice.");

  const html = `<!doctype html><html lang="${locale}" dir="${isAr ? "rtl" : "ltr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#060f1e;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem}
  .card{text-align:center;max-width:500px}
  .icon{width:64px;height:64px;border-radius:16px;background:rgba(156,42,42,.15);border:1px solid rgba(156,42,42,.4);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:28px}
  h1{font-size:1.5rem;font-weight:700;margin-bottom:.75rem}
  p{color:#6e7d93;font-size:.9rem;line-height:1.7;margin-bottom:1.8rem}
  .badge{display:inline-flex;align-items:center;gap:.5rem;padding:.4rem 1rem;border-radius:999px;background:rgba(156,42,42,.15);border:1px solid rgba(156,42,42,.4);color:#ef4444;font-size:.75rem;font-weight:600;margin-bottom:1.5rem}
  .dot{width:8px;height:8px;border-radius:50%;background:#ef4444;animation:pulse 1.5s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  a{display:inline-block;padding:.6rem 1.4rem;border-radius:10px;background:linear-gradient(135deg,#C9A227,#e8c547);color:#060f1e;font-weight:600;font-size:.85rem;text-decoration:none}
  .ref{font-family:monospace;font-size:.7rem;color:#6e7d93;margin-top:1.5rem;opacity:.5}
</style></head>
<body>
  <div class="card">
    <div class="icon">🔒</div>
    <div class="badge"><span class="dot"></span>${isAr ? "موقوف" : "Suspended"}</div>
    <h1>${title}</h1>
    <p>${body}</p>
    <a href="/${locale}">${isAr ? "العودة للرئيسية" : "Back to home"}</a>
    ${ref ? `<p class="ref">ref: ${ref}</p>` : ""}
  </div>
</body></html>`;

  return new NextResponse(html, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "300" },
  });
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Static files & Next.js internals — skip immediately
  if (
    pathname.startsWith("/_next") ||
    /\.(png|jpe?g|svg|ico|webp|woff2?|css|js\.map)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. API routes ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    if (!isKsExempt(pathname)) {
      const ks = await getKillStatus(req.nextUrl.origin);
      if (ks.globalActive) {
        return new NextResponse("Service temporarily suspended.", {
          status: 503,
          headers: { "Content-Type": "text/plain", "Retry-After": "300" },
        });
      }
      // For API calls made by sector users, check their sector lock via the token
      if (authSecret && (ks.lockedSectorIds.size > 0)) {
        const token = await getToken({ req, secret: authSecret }).catch(() => null);
        if (token) {
          const role = token.role as UserRole | undefined;
          const sectorId = (token.sectorId as string | null | undefined) ?? null;
          console.log("sectorId", sectorId);
          console.log("role", role);
          console.log("ks.lockedSectorIds", ks.lockedSectorIds);
          if (
            sectorId &&
            !SECTOR_LOCK_BYPASS_ROLES.includes(role as UserRole) &&
            ks.lockedSectorIds.has(sectorId)
          ) {
            return new NextResponse("Sector suspended.", {
              status: 503,
              headers: { "Content-Type": "text/plain", "Retry-After": "300" },
            });
          }
        }
      }
    }
    return NextResponse.next();
  }

  const locale = pathname.split("/")[1] || "en";

  // 3. Fetch kill-switch status (one cached call, covers everything)
  const ks = await getKillStatus(req.nextUrl.origin);

  // 4. Global kill switch — block all non-exempt routes
  if (ks.globalActive && !isKsExempt(pathname)) {
    return make503(locale, "platform");
  }

  // 5. Sector enforcement (two checks) ────────────────────────────────────────

  // 5a. URL-based check: /{locale}/sector/{slug} — slug can be code OR UUID
  const sectorUrlMatch = pathname.match(/^\/[a-z]{2}\/sector\/([^/]+)/);
  if (sectorUrlMatch) {
    const slug = sectorUrlMatch[1];
    if (ks.lockedSectorCodes.has(slug) || ks.lockedSectorIds.has(slug)) {
      return make503(locale, "sector", slug);
    }
  }

  // 5b. User-level check: block any authenticated user whose sector is locked
  // This covers /employee/**, /lms, /connect, /isr, etc.
  if (ks.lockedSectorIds.size > 0 && pathRequiresAuth(pathname)) {
    const token = authSecret ? await getToken({ req, secret: authSecret }).catch(() => null) : null;
    if (token) {
      const role = token.role as UserRole | undefined;
      const sectorId = (token.sectorId as string | null | undefined) ?? null;

      if (
        sectorId &&
        !SECTOR_LOCK_BYPASS_ROLES.includes(role as UserRole) &&
        ks.lockedSectorIds.has(sectorId)
      ) {
        return make503(locale, "sector");
      }
    }
  }

  // 6. Auth guard ────────────────────────────────────────────────────────────
  if (pathRequiresAuth(pathname)) {
    const token = authSecret ? await getToken({ req, secret: authSecret }).catch(() => null) : null;
    if (!token) {
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));
    }

    const role = token.role as UserRole | undefined;
    const sectorId = (token.sectorId as string | null | undefined) ?? null;
    const sectorCode = (token.sectorCode as string | null | undefined) ?? null;
    const isSuspended = token.isSuspended === true;
    const isActive = token.isActive !== false; // default true for legacy tokens

    if (isSuspended || !isActive) {
      return NextResponse.redirect(
        new URL(`/${locale}/auth/login?error=disabled`, req.url)
      );
    }

    // Only super_admin can access god-view
    if (pathname.includes("/god-view") && role !== "super_admin") {
      if (!role) return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));
      return NextResponse.redirect(new URL(getRoleHomePath(locale, role, sectorId, sectorCode), req.url));
    }
  }

  // 7. i18n locale routing
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|.*\\.woff2?).*)",
  ],
};
