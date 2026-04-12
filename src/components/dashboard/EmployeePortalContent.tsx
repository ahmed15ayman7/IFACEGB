"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Award,
  CalendarDays,
  ClipboardList,
  FileText,
  CalendarRange,
  MessageCircle,
  FileUser,
  User,
  Wallet,
} from "lucide-react";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/motion/dashboard";

const PORTAL_TABS = [
  { key: "profile", labelEn: "My Profile", labelAr: "بروفايلي", Icon: User },
  { key: "wallet", labelEn: "My Wallet", labelAr: "محفظتي", Icon: Wallet },
  { key: "rewards", labelEn: "Rewards", labelAr: "المكافآت", Icon: Award },
  { key: "attendance", labelEn: "Attendance", labelAr: "الحضور والانصراف", Icon: CalendarDays },
  { key: "leaves", labelEn: "Leaves & Requests", labelAr: "الإجازات والطلبات", Icon: ClipboardList },
  { key: "contracts", labelEn: "My Contracts", labelAr: "عقودي", Icon: FileText },
  { key: "calendar", labelEn: "Calendar & Notes", labelAr: "التقويم والنوتس", Icon: CalendarRange },
  { key: "connect", labelEn: "Connect", labelAr: "التواصل", Icon: MessageCircle },
  { key: "cv", labelEn: "My CV", labelAr: "سيرتي الذاتية", Icon: FileUser },
] as const;

type AttendanceRow = { id: string; date: Date; status: string };
type HrRequestRow = { id: string; type: string; status: string };

type Props = {
  locale: string;
  isAr: boolean;
  employee: {
    user: {
      name: string | null;
      nameAr: string | null;
      avatarUrl: string | null;
    };
    jobTitleEn: string | null;
    jobTitleAr: string | null;
    employeeCode: string;
    kineticPoints: number;
    profitSharePct: unknown;
    sector: { nameEn: string; nameAr: string | null } | null;
  };
  walletBalance: number;
  bonusesCount: number;
  attendance: AttendanceRow[];
  hrRequests: HrRequestRow[];
};

export function EmployeePortalContent({
  locale,
  isAr,
  employee,
  walletBalance,
  bonusesCount,
  attendance,
  hrRequests,
}: Props) {
  const { user, jobTitleEn, jobTitleAr, employeeCode, kineticPoints, profitSharePct, sector } =
    employee;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.header {...fadeInUp} className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[rgba(201,162,39,0.1)] border-2 border-[rgba(201,162,39,0.3)] flex items-center justify-center text-[#C9A227] overflow-hidden">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User className="size-7" aria-hidden />
          )}
        </div>
        <div>
          <h1
            className="text-xl font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {isAr ? user.nameAr ?? user.name ?? "—" : user.name ?? "—"}
          </h1>
          <p className="text-[#6e7d93] text-sm">
            {isAr ? jobTitleAr ?? jobTitleEn ?? "—" : jobTitleEn ?? "—"}
            {sector && ` · ${isAr ? sector.nameAr : sector.nameEn}`}
          </p>
          <p className="text-[#6e7d93] text-xs mt-0.5">
            Code: {employeeCode} · Kinetic Points: {kineticPoints}
          </p>
        </div>
      </motion.header>

      <motion.nav
        {...staggerContainer}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        aria-label="Employee portal sections"
      >
        {PORTAL_TABS.map((tab) => {
          const Icon = tab.Icon;
          return (
            <motion.div key={tab.key} {...staggerItem} className="shrink-0">
              <Link
                href={`/${locale}/employee/${tab.key}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(201,162,39,0.15)] text-[#A8B5C8] hover:text-[#C9A227] hover:border-[rgba(201,162,39,0.35)] transition-colors whitespace-nowrap text-xs"
              >
                <Icon className="size-3.5 shrink-0 opacity-90" aria-hidden />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>

      <motion.div
        {...staggerContainer}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          {
            value: walletBalance.toLocaleString(),
            label: isAr ? "رصيد المحفظة" : "Wallet Balance",
            sub: "coins",
            color: "#C9A227",
          },
          {
            value: String(bonusesCount),
            label: isAr ? "مكافآت معلقة" : "Pending Rewards",
            sub: "",
            color: "#e8c84a",
          },
          {
            value: String(kineticPoints),
            label: isAr ? "نقاط كينيتيك" : "Kinetic Points",
            sub: "",
            color: "#A8B5C8",
          },
          {
            value: `${Number(profitSharePct).toFixed(1)}%`,
            label: isAr ? "نسبة الأرباح" : "Profit Share",
            sub: "",
            color: "#C9A227",
          },
        ].map((card) => (
          <motion.div
            key={card.label}
            {...staggerItem}
            className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4"
          >
            <p
              className="text-2xl font-bold"
              style={{ color: card.color, fontFamily: "var(--font-eb-garamond)" }}
            >
              {card.value}
            </p>
            <p className="text-[#6e7d93] text-xs mt-1">{card.label}</p>
            {card.sub ? (
              <p className="text-[10px] text-[#6e7d93] opacity-60">{card.sub}</p>
            ) : null}
          </motion.div>
        ))}
      </motion.div>

      <motion.div {...fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-5">
          <h3
            className="text-[#C9A227] font-semibold mb-3 text-sm"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {isAr ? "سجل الحضور (آخر 7 أيام)" : "Attendance (Last 7 Days)"}
          </h3>
          <div className="space-y-2">
            {attendance.length === 0 ? (
              <p className="text-[#6e7d93] text-xs">No attendance records yet.</p>
            ) : (
              attendance.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-1.5 border-b border-[rgba(201,162,39,0.06)] last:border-0"
                >
                  <span className="text-xs text-[#A8B5C8]">
                    {new Date(a.date).toLocaleDateString("en-GB")}
                  </span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: a.status === "present" ? "rgba(34,197,94,0.1)" : "rgba(156,42,42,0.1)",
                      color: a.status === "present" ? "#22c55e" : "#9C2A2A",
                    }}
                  >
                    {a.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-5">
          <h3
            className="text-[#C9A227] font-semibold mb-3 text-sm"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {isAr ? "الطلبات الأخيرة" : "Recent HR Requests"}
          </h3>
          <div className="space-y-2">
            {hrRequests.length === 0 ? (
              <p className="text-[#6e7d93] text-xs">No requests yet.</p>
            ) : (
              hrRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-1.5 border-b border-[rgba(201,162,39,0.06)] last:border-0"
                >
                  <span className="text-xs text-[#A8B5C8]">{r.type.replace("_", " ")}</span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        r.status === "approved"
                          ? "rgba(34,197,94,0.1)"
                          : r.status === "rejected"
                            ? "rgba(156,42,42,0.1)"
                            : "rgba(201,162,39,0.1)",
                      color:
                        r.status === "approved"
                          ? "#22c55e"
                          : r.status === "rejected"
                            ? "#9C2A2A"
                            : "#C9A227",
                    }}
                  >
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
          <Link
            href={`/${locale}/employee/leaves`}
            className="mt-3 w-full h-8 text-xs rounded-lg border border-[rgba(201,162,39,0.2)] text-[#C9A227] hover:bg-[rgba(201,162,39,0.06)] flex items-center justify-center transition-colors"
          >
            {isAr ? "طلب إجازة جديدة" : "New Leave Request"}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
