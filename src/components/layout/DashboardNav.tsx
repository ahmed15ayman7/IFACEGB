"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { UserRole } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
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
  | "settings";

type NavItem = { href: string; navKey: NavKey };

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
  settings: Settings,
};

function getNavItems(role: UserRole, sectorId: string | null, locale: string): NavItem[] {
  const base = `/${locale}`;
  const settingsItem: NavItem = { href: `${base}/settings`, navKey: "settings" };

  const commonItems: NavItem[] = [{ href: `${base}/dashboard`, navKey: "dashboard" }];

  if (role === "super_admin") {
    return [
      { href: `${base}/god-view`, navKey: "god_view" },
      { href: `${base}/admin/sectors`, navKey: "sectors" },
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
    return [
      ...commonItems,
      { href: `${base}/sector/${sectorId}`, navKey: "my_sector" },
      { href: `${base}/sector/${sectorId}/requests`, navKey: "isr" },
      { href: `${base}/sector/${sectorId}/inter-ops`, navKey: "inter_ops" },
      { href: `${base}/sector/${sectorId}/wallet`, navKey: "wallet" },
      { href: `${base}/lms`, navKey: "lms" },
      { href: `${base}/connect`, navKey: "connect" },
      settingsItem,
    ];
  }

  if (role === "employee") {
    return [
      { href: `${base}/employee`, navKey: "portal" },
      { href: `${base}/employee/wallet`, navKey: "wallet" },
      { href: `${base}/employee/attendance`, navKey: "attendance" },
      { href: `${base}/employee/leaves`, navKey: "leaves" },
      { href: `${base}/employee/rewards`, navKey: "rewards" },
      { href: `${base}/lms`, navKey: "lms" },
      { href: `${base}/connect`, navKey: "connect" },
      settingsItem,
    ];
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
  locale,
}: {
  role: UserRole;
  sectorId: string | null;
  locale: string;
}) {
  const pathname = usePathname();
  const items = getNavItems(role, sectorId, locale);
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
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-[rgba(201,162,39,0.12)] text-[#C9A227] font-medium"
                  : "text-[#6e7d93] hover:text-[#A8B5C8] hover:bg-[rgba(201,162,39,0.05)]"
              }`}
            >
              <Icon className="size-[18px] shrink-0 opacity-90" aria-hidden />
              <span>{t(item.navKey)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-4 border-t border-[rgba(201,162,39,0.1)]">
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#6e7d93] hover:text-[#9C2A2A] hover:bg-[rgba(156,42,42,0.08)] transition-all"
          >
            <LogOut className="size-[18px] shrink-0" aria-hidden />
            <span>{t("sign_out")}</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
