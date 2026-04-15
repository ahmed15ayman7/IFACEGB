import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, User, Briefcase, Coins,
  CalendarCheck, FileText, Phone, MapPin, Shield,
} from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEmployeeDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.hrEmployees");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!["super_admin", "admin"].includes(session.user.role))
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true, nameAr: true, email: true, role: true,
          isActive: true, lastLoginAt: true, avatarUrl: true, createdAt: true,
        },
      },
      sector: { select: { nameEn: true, nameAr: true, code: true } },
      electronicContracts: { orderBy: { createdAt: "desc" }, take: 5 },
      attendance: {
        orderBy: { date: "desc" },
        take: 10,
        select: { date: true, checkIn: true, checkOut: true, status: true, lateMinutes: true, isGeofenced: true },
      },
    },
  });

  if (!employee) notFound();

  const wallet = await prisma.wallet.findFirst({
    where: { ownerId: employee.userId, walletType: "EmployeeWallet" },
  });

  const isRtl = locale === "ar";
  const name = isRtl ? (employee.user.nameAr ?? employee.user.name ?? "—") : (employee.user.name ?? "—");
  const jobTitle = isRtl ? (employee.jobTitleAr ?? employee.jobTitleEn ?? "—") : (employee.jobTitleEn ?? "—");
  const dept = isRtl ? (employee.departmentAr ?? employee.departmentEn ?? "—") : (employee.departmentEn ?? "—");
  const sectorName = employee.sector
    ? (isRtl ? (employee.sector.nameAr ?? employee.sector.nameEn) : employee.sector.nameEn)
    : "—";

  const INFO_ROWS = [
    { label: t("field_code"), value: employee.employeeCode },
    { label: t("field_role"), value: employee.user.role.replace("_", " ") },
    { label: t("field_sector"), value: sectorName },
    { label: t("field_job_en"), value: jobTitle },
    { label: t("field_dept_en"), value: dept },
    { label: t("field_contract"), value: employee.contractType.replace("_", " ") },
    { label: t("field_salary"), value: `${Number(employee.salaryBase).toLocaleString()} ${employee.salaryCurrency}` },
    { label: t("field_profit"), value: `${Number(employee.profitSharePct)}%` },
    { label: t("detail_hire"), value: new Date(employee.hireDate).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "long", year: "numeric" }) },
    { label: t("field_phone"), value: employee.phone ?? "—" },
    { label: t("field_national_id"), value: employee.nationalId ?? "—" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <Link
        href={`/${locale}/admin/employees`}
        className="text-xs text-[#6e7d93] hover:text-[#C9A227] inline-flex items-center gap-1 transition-colors"
      >
        {isRtl ? <ArrowRight className="size-3.5" aria-hidden /> : <ArrowLeft className="size-3.5" aria-hidden />}
        {t("title")}
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-[rgba(201,162,39,0.15)] bg-[rgba(6,15,30,0.6)] p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full border-2 border-[rgba(201,162,39,0.3)] bg-[rgba(201,162,39,0.08)] flex items-center justify-center text-[#C9A227] text-2xl font-bold overflow-hidden">
              {employee.user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={employee.user.avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                (name[0] ?? "?").toUpperCase()
              )}
            </div>
            <div>
              <h1
                className="text-2xl font-bold text-[#C9A227]"
                style={{ fontFamily: "var(--font-eb-garamond)" }}
              >
                {name}
              </h1>
              <p className="text-sm text-[#A8B5C8] mt-0.5">{employee.user.email}</p>
              <p className="text-xs text-[#6e7d93] mt-0.5">{jobTitle} · {sectorName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{
                background: employee.user.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                color: employee.user.isActive ? "#22c55e" : "#ef4444",
                border: `1px solid ${employee.user.isActive ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
              }}
            >
              {employee.user.isActive ? t("active") : t("inactive")}
            </span>
            <Link
              href={`/${locale}/admin/employees/new`}
              className="h-8 px-3 text-xs rounded-lg border border-[rgba(201,162,39,0.25)] text-[#C9A227] hover:bg-[rgba(201,162,39,0.08)] transition-colors"
            >
              {t("detail_edit")}
            </Link>
          </div>
        </div>

        {/* KPI strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-[rgba(201,162,39,0.08)]">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
              {employee.kineticPoints.toLocaleString()}
            </p>
            <p className="text-[10px] text-[#6e7d93] mt-0.5">{t("detail_kinetic")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#22c55e]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
              {wallet ? Number(wallet.balanceCoins).toLocaleString() : "—"}
            </p>
            <p className="text-[10px] text-[#6e7d93] mt-0.5">Wallet (coins)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#A8B5C8]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
              {employee.electronicContracts.length}
            </p>
            <p className="text-[10px] text-[#6e7d93] mt-0.5">{t("detail_tab_contracts")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#A8B5C8]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
              {employee.attendance.length}
            </p>
            <p className="text-[10px] text-[#6e7d93] mt-0.5">Attendance records</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile info */}
        <div className="rounded-2xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.5)] p-5">
          <h2 className="text-sm font-semibold text-[#C9A227] mb-4 flex items-center gap-2">
            <User className="size-4" aria-hidden />
            {t("detail_tab_profile")}
          </h2>
          <div className="space-y-3">
            {INFO_ROWS.map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-2 text-xs">
                <span className="text-[#6e7d93] shrink-0">{label}</span>
                <span className="text-[#A8B5C8] text-end capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance */}
        <div className="rounded-2xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.5)] p-5">
          <h2 className="text-sm font-semibold text-[#C9A227] mb-4 flex items-center gap-2">
            <CalendarCheck className="size-4" aria-hidden />
            {t("detail_tab_attendance")}
          </h2>
          {employee.attendance.length === 0 ? (
            <p className="text-xs text-[#6e7d93] py-6 text-center">No attendance records.</p>
          ) : (
            <div className="space-y-2">
              {employee.attendance.map((rec) => (
                <div key={rec.date.toISOString()} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#6e7d93]">
                    {new Date(rec.date).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className="text-[#22c55e] font-mono">
                    {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString(isRtl ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </span>
                  <span className="text-[#ef4444] font-mono">
                    {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString(isRtl ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: rec.status === "present" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: rec.status === "present" ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {rec.status}
                    {rec.lateMinutes > 0 && ` +${rec.lateMinutes}m`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contracts */}
        <div className="rounded-2xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.5)] p-5">
          <h2 className="text-sm font-semibold text-[#C9A227] mb-4 flex items-center gap-2">
            <FileText className="size-4" aria-hidden />
            {t("detail_tab_contracts")}
          </h2>
          {employee.electronicContracts.length === 0 ? (
            <p className="text-xs text-[#6e7d93] py-6 text-center">No contracts on file.</p>
          ) : (
            <div className="space-y-2">
              {employee.electronicContracts.map((c) => {
                const statusColors: Record<string, string> = { signed: "#22c55e", pending: "#C9A227", draft: "#A8B5C8", expired: "#ef4444" };
                const color = statusColors[c.status] ?? "#A8B5C8";
                return (
                  <div key={c.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#A8B5C8] capitalize">{c.templateType.replace("_", " ")}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color, background: `${color}10`, border: `1px solid ${color}30` }}>
                      {c.status}
                    </span>
                    <span className="text-[#6e7d93]">
                      {new Date(c.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Wallet summary */}
        {wallet && (
          <div className="rounded-2xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.5)] p-5">
            <h2 className="text-sm font-semibold text-[#C9A227] mb-4 flex items-center gap-2">
              <Coins className="size-4" aria-hidden />
              {t("detail_tab_wallet")}
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6e7d93]">Balance</span>
                <span className="text-[#C9A227] font-mono font-semibold">{Number(wallet.balanceCoins).toLocaleString()} coins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6e7d93]">Reserved</span>
                <span className="text-[#A8B5C8] font-mono">{Number(wallet.reservedCoins).toLocaleString()} coins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6e7d93]">Status</span>
                <span style={{ color: wallet.isLocked ? "#ef4444" : "#22c55e" }}>
                  {wallet.isLocked ? "Locked" : "Active"}
                </span>
              </div>
              <div className="pt-2">
                <Link
                  href={`/${locale}/admin/finance`}
                  className="text-[10px] text-[#C9A227] hover:text-[#e8c84a] transition-colors"
                >
                  View in Finance →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
