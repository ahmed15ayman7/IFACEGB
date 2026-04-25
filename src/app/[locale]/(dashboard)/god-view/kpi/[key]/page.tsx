import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getDirectiveWithReaders, getNotAckedUsers } from "@/lib/god-view/directive-readers";
import type { ReactNode } from "react";

const KPI_KEYS = [
  "certificates",
  "financial",
  "exams",
  "agents",
  "pending-directives",
  "critical-alerts",
  "successful-directives",
  "trainers",
  "centers",
] as const;
type KpiKey = (typeof KPI_KEYS)[number];

const TITLE_KEYS: Record<
  KpiKey,
  | "kpiDetailTitle_certificates"
  | "kpiDetailTitle_financial"
  | "kpiDetailTitle_exams"
  | "kpiDetailTitle_agents"
  | "kpiDetailTitle_pendingDirectives"
  | "kpiDetailTitle_criticalAlerts"
  | "kpiDetailTitle_successfulDirectives"
  | "kpiDetailTitle_trainers"
  | "kpiDetailTitle_centers"
> = {
  certificates: "kpiDetailTitle_certificates",
  financial: "kpiDetailTitle_financial",
  exams: "kpiDetailTitle_exams",
  agents: "kpiDetailTitle_agents",
  "pending-directives": "kpiDetailTitle_pendingDirectives",
  "critical-alerts": "kpiDetailTitle_criticalAlerts",
  "successful-directives": "kpiDetailTitle_successfulDirectives",
  trainers: "kpiDetailTitle_trainers",
  centers: "kpiDetailTitle_centers",
};

function isKpiKey(s: string): s is KpiKey {
  return (KPI_KEYS as readonly string[]).includes(s);
}

export const dynamic = "force-dynamic";

export default async function GodViewKpiDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  const { key: raw } = await params;
  if (!isKpiKey(raw)) notFound();

  const key = raw;
  const { d: directiveId } = await searchParams;
  const session = await auth();
  const locale = await getLocale();
  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (session.user.role !== "super_admin") {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const t = await getTranslations("dashboard.godView");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const backHref = `/${locale}/god-view`;
  const title = t(TITLE_KEYS[key]);

  if (key === "successful-directives") {
    const directives = await prisma.eDirective.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { _count: { select: { acks: true } } },
    });
    const selectedId =
      directiveId && directives.some((x) => x.id === directiveId) ? directiveId : directives[0]?.id;
    const directiveFull = selectedId ? await getDirectiveWithReaders(selectedId) : null;
    const ackUserIds = new Set(
      directiveFull?.acks.map((a) => a.userId) ?? [],
    );
    const ackUsers =
      directiveFull?.acks.map((a) => a.user) ?? [];
    const notAcked = directiveFull
      ? await getNotAckedUsers(directiveFull, ackUserIds)
      : [];
    return (
      <div className="min-h-screen p-4 lg:p-6 max-w-6xl mx-auto space-y-6" dir="auto">
        <div>
          <Link href={backHref} className="text-sm text-[#C9A227] hover:underline">
            {t("kpiDetailBack")}
          </Link>
          <h1
            className="text-2xl font-bold text-[#C9A227] mt-2"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {title}
          </h1>
          <p className="text-[#6e7d93] text-sm mt-1">{t("kpiDetailSuccessfulHint")}</p>
        </div>

        {directives.length === 0 ? (
          <p className="text-[#6e7d93]">{t("kpiDetailEmpty")}</p>
        ) : (
          <>
            <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4 overflow-x-auto">
              <p className="text-xs text-[#6e7d93] mb-2">{t("kpiDetailPickDirective")}</p>
              <ul className="space-y-1 min-w-0">
                {directives.map((dir) => {
                  const active = selectedId === dir.id;
                  return (
                    <li key={dir.id}>
                      <Link
                        href={`/${locale}/god-view/kpi/successful-directives?d=${dir.id}`}
                        className={`block rounded-lg px-3 py-2 text-sm border transition-colors ${
                          active
                            ? "border-[rgba(201,162,39,0.45)] bg-[rgba(201,162,39,0.1)] text-[#e8c84a]"
                            : "border-transparent hover:border-[rgba(201,162,39,0.2)] text-[#A8B5C8]"
                        }`}
                      >
                        <span className="font-medium">{dir.titleEn}</span>
                        <span className="text-[#6e7d93] text-xs ms-2">
                          · {dir._count.acks} {t("kpiDetailAcksSuffix")}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {directiveFull && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-sovereign-card rounded-xl border border-[rgba(34,197,94,0.2)] p-4">
                  <h2 className="text-sm font-semibold text-emerald-400/90 mb-3">
                    {t("kpiDetailAcknowledged")}
                    <span className="text-[#6e7d93] font-normal ms-1">({ackUsers.length})</span>
                  </h2>
                  <ul className="space-y-2 text-sm max-h-[420px] overflow-y-auto">
                    {ackUsers.map((u) => (
                      <li key={u.id} className="text-[#A8B5C8] border-b border-white/5 pb-2">
                        <span className="text-white">{u.name ?? u.email}</span>
                        <span className="text-xs text-[#6e7d93] block">{u.email}</span>
                        <span className="text-xs text-[#6e7d93]">{u.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-sovereign-card rounded-xl border border-[rgba(156,42,42,0.25)] p-4">
                  <h2 className="text-sm font-semibold text-rose-300/90 mb-3">
                    {t("kpiDetailNotAcknowledged")}
                    <span className="text-[#6e7d93] font-normal ms-1">({notAcked.length})</span>
                  </h2>
                  {notAcked.length === 0 ? (
                    <p className="text-sm text-[#6e7d93]">{t("kpiDetailAllCaughtUp")}</p>
                  ) : (
                    <ul className="space-y-2 text-sm max-h-[420px] overflow-y-auto">
                      {notAcked.map((u) => (
                        <li key={u.id} className="text-[#A8B5C8] border-b border-white/5 pb-2">
                          <span className="text-white">{u.name ?? u.email}</span>
                          <span className="text-xs text-[#6e7d93] block">{u.email}</span>
                          <span className="text-xs text-[#6e7d93]">{u.role}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  if (key === "certificates") {
    const rows = await prisma.certificate.findMany({
      where: { issueDate: { gte: today } },
      orderBy: { issueDate: "desc" },
      take: 200,
      include: { holder: { select: { name: true, email: true } } },
    });
    return (
      <KpiTableShell backHref={backHref} title={title} t={t}>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-[#6e7d93] text-xs">
              <th className="py-2 pe-2">{t("kpiColProgram")}</th>
              <th className="py-2 pe-2">{t("kpiColHolder")}</th>
              <th className="py-2">{t("kpiColTime")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-white/5 text-[#A8B5C8]">
                <td className="py-2 pe-2">{c.programEn}</td>
                <td className="py-2 pe-2">{c.holder.name ?? c.holder.email}</td>
                <td className="py-2 text-xs text-[#6e7d93]">
                  {c.issueDate.toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-[#6e7d93] text-sm py-4">{t("kpiDetailEmpty")}</p>}
      </KpiTableShell>
    );
  }

  if (key === "financial") {
    const rows = await prisma.coinTransaction.findMany({
      where: { createdAt: { gte: today }, status: "completed" },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return (
      <KpiTableShell backHref={backHref} title={title} t={t}>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-[#6e7d93] text-xs">
              <th className="py-2 pe-2">{t("kpiColType")}</th>
              <th className="py-2 pe-2">{t("kpiColAmount")}</th>
              <th className="py-2">{t("kpiColTime")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5 text-[#A8B5C8]">
                <td className="py-2 pe-2">{r.type}</td>
                <td className="py-2 pe-2 text-[#C9A227]">
                  {Number(r.amountCoins).toLocaleString()}
                </td>
                <td className="py-2 text-xs text-[#6e7d93]">
                  {r.createdAt.toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-[#6e7d93] text-sm py-4">{t("kpiDetailEmpty")}</p>}
      </KpiTableShell>
    );
  }

  if (key === "exams") {
    const rows = await prisma.examSession.findMany({
      where: { status: "in_progress" },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const userIds = [...new Set(rows.map((r) => r.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const uMap = new Map(users.map((u) => [u.id, u]));
    return (
      <KpiTableShell backHref={backHref} title={title} t={t}>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-[#6e7d93] text-xs">
              <th className="py-2 pe-2">{t("kpiColCandidate")}</th>
              <th className="py-2 pe-2">Token</th>
              <th className="py-2">{t("kpiColTime")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const u = uMap.get(r.userId);
              return (
                <tr key={r.id} className="border-t border-white/5 text-[#A8B5C8]">
                  <td className="py-2 pe-2">{u?.name ?? u?.email ?? r.userId}</td>
                  <td className="py-2 pe-2 text-xs break-all max-w-[120px]">{r.sessionToken}</td>
                  <td className="py-2 text-xs text-[#6e7d93]">
                    {r.startedAt?.toLocaleString(locale === "ar" ? "ar-EG" : "en-GB") ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-[#6e7d93] text-sm py-4">{t("kpiDetailEmpty")}</p>}
      </KpiTableShell>
    );
  }

  if (key === "agents") {
    const rows = await prisma.agentLicense.findMany({
      where: { status: "active" },
      orderBy: { issuedAt: "desc" },
      take: 200,
      include: { franchise: { select: { nameEn: true, nameAr: true } } },
    });
    const userIds = [...new Set(rows.map((r) => r.agentUserId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const uMap = new Map(users.map((u) => [u.id, u]));
    return (
      <KpiTableShell backHref={backHref} title={title} t={t}>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-[#6e7d93] text-xs">
              <th className="py-2 pe-2">{t("kpiColAgent")}</th>
              <th className="py-2 pe-2">{t("kpiColFranchise")}</th>
              <th className="py-2">{t("kpiColLicense")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const u = uMap.get(r.agentUserId);
              return (
                <tr key={r.id} className="border-t border-white/5 text-[#A8B5C8]">
                  <td className="py-2 pe-2">{u?.name ?? u?.email}</td>
                  <td className="py-2 pe-2">
                    {locale === "ar" && r.franchise?.nameAr ? r.franchise.nameAr : r.franchise.nameEn}
                  </td>
                  <td className="py-2 text-xs">{r.licenseNo}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-[#6e7d93] text-sm py-4">{t("kpiDetailEmpty")}</p>}
      </KpiTableShell>
    );
  }

  if (key === "pending-directives") {
    const rows = await prisma.eDirective.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { _count: { select: { acks: true } } },
    });
    return (
      <KpiTableShell backHref={backHref} title={title} t={t}>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-[#6e7d93] text-xs">
              <th className="py-2 pe-2">{t("kpiColTitle")}</th>
              <th className="py-2 pe-2">{t("kpiColTarget")}</th>
              <th className="py-2">{t("kpiColAcks")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5 text-[#A8B5C8]">
                <td className="py-2 pe-2">{r.titleEn}</td>
                <td className="py-2 pe-2 text-xs">{r.targetType}</td>
                <td className="py-2">{r._count.acks}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-[#6e7d93] text-sm py-4">{t("kpiDetailEmpty")}</p>}
      </KpiTableShell>
    );
  }

  if (key === "critical-alerts") {
    const rows = await prisma.auditTrail.findMany({
      where: { severity: "critical", createdAt: { gte: dayAgo } },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { name: true, email: true } } },
    });
    return (
      <KpiTableShell backHref={backHref} title={title} t={t}>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-[#6e7d93] text-xs">
              <th className="py-2 pe-2">{t("kpiColAction")}</th>
              <th className="py-2 pe-2">{t("kpiColUser")}</th>
              <th className="py-2">{t("kpiColTime")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5 text-[#A8B5C8]">
                <td className="py-2 pe-2">{r.action}</td>
                <td className="py-2 pe-2">{r.user?.name ?? r.user?.email ?? "—"}</td>
                <td className="py-2 text-xs text-[#6e7d93]">
                  {r.createdAt.toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-[#6e7d93] text-sm py-4">{t("kpiDetailEmpty")}</p>}
      </KpiTableShell>
    );
  }

  if (key === "trainers") {
    const rows = await prisma.user.findMany({
      where: { role: "trainer" },
      orderBy: { email: "asc" },
      take: 500,
      select: { id: true, name: true, nameAr: true, email: true, createdAt: true },
    });
    return (
      <KpiTableShell backHref={backHref} title={title} t={t}>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-[#6e7d93] text-xs">
              <th className="py-2 pe-2">{t("kpiColName")}</th>
              <th className="py-2">{t("kpiColEmail")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5 text-[#A8B5C8]">
                <td className="py-2 pe-2">
                  {locale === "ar" && r.nameAr ? r.nameAr : r.name ?? "—"}
                </td>
                <td className="py-2 text-xs break-all">{r.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-[#6e7d93] text-sm py-4">{t("kpiDetailEmpty")}</p>}
      </KpiTableShell>
    );
  }

  if (key === "centers") {
    const rows = await prisma.accreditedCenter.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { franchise: { select: { nameEn: true, nameAr: true } } },
    });
    return (
      <KpiTableShell backHref={backHref} title={title} t={t}>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-[#6e7d93] text-xs">
              <th className="py-2 pe-2">{t("kpiColCenter")}</th>
              <th className="py-2 pe-2">{t("kpiColFranchise")}</th>
              <th className="py-2">{t("kpiColLocation")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5 text-[#A8B5C8]">
                <td className="py-2 pe-2">
                  {locale === "ar" && r.nameAr ? r.nameAr : r.nameEn}
                </td>
                <td className="py-2 pe-2 text-xs">
                  {r.franchise
                    ? locale === "ar" && r.franchise.nameAr
                      ? r.franchise.nameAr
                      : r.franchise.nameEn
                    : "—"}
                </td>
                <td className="py-2 text-xs">
                  {r.city ?? "—"} · {r.countryCode}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-[#6e7d93] text-sm py-4">{t("kpiDetailEmpty")}</p>}
      </KpiTableShell>
    );
  }

  notFound();
}

function KpiTableShell({
  backHref,
  title,
  t,
  children,
}: {
  backHref: string;
  title: string;
  t: (key: string) => string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen p-4 lg:p-6 max-w-5xl mx-auto space-y-4" dir="auto">
      <div>
        <Link href={backHref} className="text-sm text-[#C9A227] hover:underline">
          {t("kpiDetailBack")}
        </Link>
        <h1
          className="text-2xl font-bold text-[#C9A227] mt-2"
          style={{ fontFamily: "var(--font-eb-garamond)" }}
        >
          {title}
        </h1>
      </div>
      <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4 overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
