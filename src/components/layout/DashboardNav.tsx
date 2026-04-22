"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { UserRole } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import type { SessionExtraSectorAccess } from "@/types/next-auth";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import {
  Award,
  BookOpen,
  Building,
  Building2,
  CalendarDays,
  CalendarCheck2,
  Cpu,
  Eye,
  FileText,
  Globe,
  GraduationCap,
  Inbox,
  Landmark,
  LayoutDashboard,
  Link2,
  LogOut,
  MessageCircle,
  Network,
  Scale,
  ScrollText,
  Settings,
  Shield,
  Ticket,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";

type NavKey =
  | "dashboard"
  | "god_view"
  | "sectors"
  | "hr"
  | "finance"
  | "training"
  | "accreditation"
  | "consultancy"
  | "tech"
  | "partnerships"
  | "lms"
  | "connect"
  | "my_sector"
  | "isr"
  | "inter_ops"
  | "wallet"
  | "portal"
  | "rewards"
  | "attendance"
  | "leaves"
  | "hr_requests"
  | "franchise"
  | "centers"
  | "license"
  | "tickets"
  | "courses"
  | "certificates"
  | "trainers"
  | "general_admin"
  | "departments"
  | "all_users"
  | "settings";

type NavItem = { href: string; navKey: NavKey; label?: string; sectionKey?: string };

const NAV_ICONS: Record<NavKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  god_view: Eye,
  sectors: Building2,
  hr: Users,
  finance: Landmark,
  training: GraduationCap,
  accreditation: Shield,
  consultancy: Scale,
  tech: Cpu,
  partnerships: Globe,
  lms: BookOpen,
  connect: MessageCircle,
  my_sector: Building,
  isr: Inbox,
  inter_ops: Link2,
  wallet: Wallet,
  portal: UserCircle,
  rewards: Award,
  attendance: CalendarDays,
  leaves: CalendarCheck2,
  hr_requests: CalendarCheck2,
  franchise: Network,
  centers: Building,
  license: ScrollText,
  tickets: Ticket,
  courses: BookOpen,
  certificates: FileText,
  trainers: Users,
  general_admin: Building2,
  departments: Building,
  all_users: Users,
  settings: Settings,
};

/** Extra sector dashboards the user is allowed to open (in addition to home sector). */
function appendCrossSectorItems(
  base: string,
  items: NavItem[],
  extra: SessionExtraSectorAccess[] | undefined,
  primarySectorId: string | null
): NavItem[] {
  if (!extra?.length) return items;
  const seen = new Set<string>();
  if (primarySectorId) seen.add(primarySectorId);
  const out = [...items];
  for (const e of extra) {
    if (seen.has(e.sectorId)) continue;
    seen.add(e.sectorId);
    const prefix = e.nameEn.length > 24 ? `${e.nameEn.slice(0, 22)}…` : e.nameEn;
    if (e.code === "general-admin") {
      out.push(
        { href: `${base}/general-admin`, navKey: "my_sector", label: `${prefix} — Home` },
        { href: `${base}/general-admin/isr`, navKey: "isr", label: `${prefix} — ISR` },
        { href: `${base}/general-admin/wallet`, navKey: "wallet", label: `${prefix} — Wallet` },
        { href: `${base}/general-admin/departments`, navKey: "departments", label: `${prefix} — Depts` }
      );
    } else {
      const root = `${base}/sector/${e.sectorId}`;
      out.push(
        { href: root, navKey: "my_sector", label: `${prefix} — Home` },
        { href: `${root}/requests`, navKey: "isr", label: `${prefix} — ISR` },
        { href: `${root}/inter-ops`, navKey: "inter_ops", label: `${prefix} — Inter-ops` },
        { href: `${root}/wallet`, navKey: "wallet", label: `${prefix} — Wallet` }
      );
    }
  }
  return out;
}

function getNavItems(
  role: UserRole,
  sectorId: string | null,
  sectorCode: string | null,
  locale: string,
  extraSectorAccess?: SessionExtraSectorAccess[]
): NavItem[] {
  const base = `/${locale}`;
  const settingsItem: NavItem = { href: `${base}/settings`, navKey: "settings" };

  const commonItems: NavItem[] = [{ href: `${base}/dashboard`, navKey: "dashboard" }];

  if (role === "super_admin") {
    return [
      { href: `${base}/god-view`, navKey: "god_view" },
      { href: `${base}/admin/sectors`, navKey: "sectors" },
      { href: `${base}/admin/users`, navKey: "all_users" },
      { href: `${base}/admin/employees`, navKey: "hr" },
      { href: `${base}/admin/hr-requests`, navKey: "hr_requests" },
      { href: `${base}/admin/rewards`, navKey: "rewards" },
      { href: `${base}/admin/finance`, navKey: "finance" },
      { href: `${base}/general-admin`, navKey: "general_admin" },
      { href: `${base}/sector/training`, navKey: "training" },
      { href: `${base}/sector/accreditation`, navKey: "accreditation" },
      { href: `${base}/sector/consultancy`, navKey: "consultancy" },
      { href: `${base}/sector/tech`, navKey: "tech" },
      { href: `${base}/sector/partnerships`, navKey: "partnerships" },
      { href: `${base}/lms`, navKey: "lms" },
      { href: `${base}/connect`, navKey: "connect" },
      settingsItem,
    ];
  }

  if (role === "admin") {
    return [
      ...commonItems,
      { href: `${base}/admin/sectors`, navKey: "sectors" },
      { href: `${base}/admin/users`, navKey: "all_users" },
      { href: `${base}/admin/employees`, navKey: "hr" },
      { href: `${base}/admin/hr-requests`, navKey: "hr_requests" },
      { href: `${base}/admin/rewards`, navKey: "rewards" },
      { href: `${base}/admin/finance`, navKey: "finance" },
      { href: `${base}/general-admin`, navKey: "general_admin" },
      { href: `${base}/connect`, navKey: "connect" },
      settingsItem,
    ];
  }

  if (role === "sector_manager" && sectorId) {
    const isGeneralAdmin = sectorCode === "general-admin";
    const home = isGeneralAdmin ? `${base}/general-admin` : `${base}/sector/${sectorId}`;
    const isr = isGeneralAdmin ? `${base}/general-admin/isr` : `${base}/sector/${sectorId}/requests`;
    const interOps = isGeneralAdmin
      ? `${base}/general-admin/departments`
      : `${base}/sector/${sectorId}/inter-ops`;
    const wallet = isGeneralAdmin
      ? `${base}/general-admin/wallet`
      : `${base}/sector/${sectorId}/wallet`;
    return appendCrossSectorItems(
      base,
      [
        ...commonItems,
        { href: home, navKey: "my_sector" },
        { href: isr, navKey: "isr" },
        { href: interOps, navKey: isGeneralAdmin ? "departments" : "inter_ops" },
        { href: wallet, navKey: "wallet" },
        { href: `${base}/lms`, navKey: "lms" },
        { href: `${base}/connect`, navKey: "connect" },
        settingsItem,
      ],
      extraSectorAccess,
      sectorId
    );
  }

  if (role === "employee") {
    return appendCrossSectorItems(
      base,
      [
        { href: `${base}/employee`, navKey: "portal" },
        { href: `${base}/employee/wallet`, navKey: "wallet" },
        { href: `${base}/employee/attendance`, navKey: "attendance" },
        { href: `${base}/employee/leaves`, navKey: "leaves" },
        { href: `${base}/employee/rewards`, navKey: "rewards" },
        { href: `${base}/lms`, navKey: "lms" },
        { href: `${base}/connect`, navKey: "connect" },
        settingsItem,
      ],
      extraSectorAccess,
      sectorId
    );
  }

  if (role === "trainer") {
    return [
      { href: `${base}/trainer`, navKey: "portal" },
      { href: `${base}/trainer/courses`, navKey: "courses" },
      { href: `${base}/trainer/certificates`, navKey: "certificates" },
      { href: `${base}/trainer/wallet`, navKey: "wallet" },
      { href: `${base}/trainer/accreditation`, navKey: "accreditation" },
      { href: `${base}/connect`, navKey: "connect" },
      settingsItem,
    ];
  }

  if (role === "agent") {
    return [
      { href: `${base}/franchise`, navKey: "franchise" },
      { href: `${base}/franchise/centers`, navKey: "centers" },
      { href: `${base}/franchise/license`, navKey: "license" },
      { href: `${base}/franchise/tickets`, navKey: "tickets" },
      { href: `${base}/connect`, navKey: "connect" },
      settingsItem,
    ];
  }

  if (role === "center") {
    return [
      { href: `${base}/center`, navKey: "portal" },
      { href: `${base}/center/trainers`, navKey: "trainers" },
      { href: `${base}/center/certificates`, navKey: "certificates" },
      { href: `${base}/center/wallet`, navKey: "wallet" },
      { href: `${base}/center/accreditation`, navKey: "accreditation" },
      { href: `${base}/connect`, navKey: "connect" },
      settingsItem,
    ];
  }

  if (role === "client") {
    return [
      { href: `${base}/client`, navKey: "portal" },
      { href: `${base}/client/courses`, navKey: "courses" },
      { href: `${base}/client/certificates`, navKey: "certificates" },
      { href: `${base}/client/tickets`, navKey: "tickets" },
      settingsItem,
    ];
  }

  if (role === "user") {
    return [
      { href: `${base}/user`, navKey: "portal" },
      { href: `${base}/user/courses`, navKey: "courses" },
      { href: `${base}/user/certificates`, navKey: "certificates" },
      settingsItem,
    ];
  }

  return [...commonItems, settingsItem];
}

export function DashboardNav({
  role,
  sectorId,
  sectorCode = null,
  locale,
  extraSectorAccess = [],
}: {
  role: UserRole;
  sectorId: string | null;
  sectorCode?: string | null;
  locale: string;
  extraSectorAccess?: SessionExtraSectorAccess[];
}) {
  const pathname = usePathname();
  const items = getNavItems(role, sectorId, sectorCode, locale, extraSectorAccess);
  const t = useTranslations("dashboard.nav");
  const tDash = useTranslations("dashboard");

  return (
    <aside className="w-56 shrink-0 hidden md:flex flex-col border-r border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.95)] min-h-screen sticky top-0">
      <div className="flex items-center justify-between gap-2 px-4 py-5 border-b border-[rgba(201,162,39,0.1)]">
        <div className="flex items-center gap-2.5">
          <Image src="/logo-dark.png" alt="iFACE" width={32} height={32} className="w-8 h-8" />
          <span
            className="text-[#C9A227] text-sm font-semibold"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {tDash("brand_os")}
          </span>
        </div>
        <NotificationBell />
      </div>

      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = NAV_ICONS[item.navKey];
          return (
            <Link
              key={`${item.href}-${item.label ?? item.navKey}`}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-[rgba(201,162,39,0.12)] text-[#C9A227] font-medium"
                  : "text-[#6e7d93] hover:text-[#A8B5C8] hover:bg-[rgba(201,162,39,0.05)]"
              }`}
            >
              <Icon className="size-[18px] shrink-0 opacity-90" aria-hidden />
              <span className="truncate">{item.label ?? t(item.navKey)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-4 border-t border-[rgba(201,162,39,0.1)]">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#6e7d93] hover:text-[#9C2A2A] hover:bg-[rgba(156,42,42,0.08)] transition-all"
        >
          <LogOut className="size-[18px] shrink-0" aria-hidden />
          <span>{t("sign_out")}</span>
        </button>
      </div>
    </aside>
  );
}
