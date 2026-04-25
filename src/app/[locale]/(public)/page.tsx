import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import { prisma } from "@/lib/prisma";
import { NewPublicLanding } from "@/components/landing/NewPublicLanding";
import type { ExcellenceNetworkData } from "@/components/landing/sections/ExcellenceNetworkSection";
import { startOfMonth, differenceInCalendarMonths } from "date-fns";
import { Employee, IfaceEvent, IfaceNews, Sector, SuccessPartner, User, FranchiseTier } from "@prisma/client";
import { format } from "date-fns";
type Props = { params: Promise<{ locale: string }> };

function scoreLabelFromPoints(points: number): string {
  if (points >= 5000) return "5";
  if (points >= 3000) return "4.5";
  if (points >= 1500) return "4";
  if (points >= 500) return "3";
  return "2";
}

function tierLabel(t: FranchiseTier, isAr: boolean): string {
  if (t === "master") return isAr ? "رئيسي" : "Master";
  if (t === "regional") return isAr ? "إقليمي" : "Regional";
  return isAr ? "محلي" : "Local";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("home", locale as "en" | "ar");
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const isAr = rawLocale === "ar";
  const now = new Date();
  const monthStart = startOfMonth(now);

  let sectors: Partial<Sector>[] = [];
  let news: Partial<IfaceNews>[] = [];
  let events: Partial<IfaceEvent>[] = [];
  let employeeOfMonth: (Partial<Employee> & {
    user: Partial<User>;
  }) & {
    _attendanceCount?: number;
    _completedProjects?: number;
  } | null = null;
  let partners: Partial<SuccessPartner>[] = [];
  let userCount = 0;
  let certCount = 0;
  let agentCount = 0;
  let countriesCount = 0;
  let excellenceNetwork: ExcellenceNetworkData = { agent: null, center: null, trainer: null };

  try {
    [
      sectors,
      news,
      events,
      partners,
      userCount,
      certCount,
      agentCount,
      countriesCount,
    ] = await Promise.all([
      prisma.sector.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, code: true, nameEn: true, nameAr: true, color: true, iconUrl: true },
      }),
      prisma.ifaceNews.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
        take: 6,
        select: { id: true, titleEn: true, titleAr: true, imageUrl: true, category: true, publishedAt: true, createdAt: true },
      }),
      prisma.ifaceEvent.findMany({
        where: { isPublished: true, startDate: { gte: now } },
        orderBy: { startDate: "asc" },
        take: 6,
        select: { id: true, titleEn: true, titleAr: true, location: true, startDate: true, eventType: true, coverUrl: true },
      }),
      prisma.successPartner.findMany({
        orderBy: { sortOrder: "asc" },
        take: 16,
        select: { id: true, nameEn: true, nameAr: true, logoUrl: true },
      }),
      prisma.user.count({ where: { role: { in: ["employee", "trainer"] } } }),
      prisma.certificate.count({ where: { status: "issued" } }),
      prisma.agentLicense.count({ where: { status: "active" } }),
      prisma.franchiseCountry.count(),
    ]);

    // Employee of the Month — highest kineticPoints active employee
    const topEmployee = await prisma.employee.findFirst({
      where: { isActive: true },
      orderBy: { kineticPoints: "desc" },
      include: {
        user: { select: { name: true, nameAr: true, avatarUrl: true } },
        performanceTargets: { where: { isAchieved: true } },
        attendance: {
          where: { date: { gte: monthStart } },
          select: { checkIn: true },
        },
      },
    });

    if (topEmployee) {
      const completedProjects = topEmployee.performanceTargets.length;
      const attendanceCount = topEmployee.attendance.filter((a) => a.checkIn !== null).length;
      employeeOfMonth = {
        ...topEmployee,
        _completedProjects: completedProjects,
        _attendanceCount: attendanceCount,
      };
    }

    const workingDays = 22;
    const licenses = await prisma.agentLicense.findMany({
      where: { status: "active" },
      include: {
        _count: { select: { actionsLog: true } },
        franchise: { select: { nameEn: true, nameAr: true } },
      },
    });
    type LicenseRow = (typeof licenses)[0];
    const byUser = new Map<string, { total: number; bestLicense: LicenseRow }>();
    for (const L of licenses) {
      const n = L._count.actionsLog;
      const existing = byUser.get(L.agentUserId);
      if (!existing) {
        byUser.set(L.agentUserId, { total: n, bestLicense: L });
      } else {
        existing.total += n;
        if (L._count.actionsLog > existing.bestLicense._count.actionsLog) {
          existing.bestLicense = L;
        }
      }
    }
    let bestUserId: string | null = null;
    let bestTotal = 0;
    for (const [uid, agg] of byUser) {
      if (agg.total > bestTotal) {
        bestTotal = agg.total;
        bestUserId = uid;
      }
    }
    if (!bestUserId && licenses.length > 0) {
      const latest = [...licenses].sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())[0]!;
      bestUserId = latest.agentUserId;
      bestTotal = byUser.get(bestUserId)?.total ?? 0;
    }
    if (bestUserId) {
      const agentUser = await prisma.user.findUnique({
        where: { id: bestUserId },
        select: { name: true, nameAr: true, avatarUrl: true },
      });
      const agg = byUser.get(bestUserId) ?? null;
      if (agentUser && agg) {
        const L = agg.bestLicense;
        const f = L.franchise;
        const kicker = Math.min(20_000, bestTotal * 500);
        const subEn = f ? [f.nameEn, L.countryCode].filter(Boolean).join(" · ") : L.countryCode;
        const subAr2 = f ? [f.nameAr ?? f.nameEn, L.countryCode].filter(Boolean).join(" · ") : L.countryCode;
        excellenceNetwork.agent = {
          name: agentUser.name ?? "—",
          nameAr: agentUser.nameAr,
          subtitle: subEn,
          subtitleAr: subAr2,
          kickerPoints: kicker,
          mode: "avatar",
          avatarUrl: agentUser.avatarUrl,
          metrics: [
            { value: String(bestTotal) },
            { value: `${Math.min(100, bestTotal * 4)}%` },
            { value: scoreLabelFromPoints(kicker) },
          ],
        };
      }
    }

    const centers = await prisma.accreditedCenter.findMany({
      where: { isActive: true },
      include: { franchise: { select: { nameEn: true, nameAr: true, tier: true, isActive: true } } },
      take: 100,
    });
    const centersOk = centers.filter((c) => !c.franchiseId || c.franchise?.isActive !== false);
    const rankTier = (t: FranchiseTier | undefined) => (t === "master" ? 3 : t === "regional" ? 2 : 1);
    centersOk.sort((a, b) => {
      const tr = rankTier(b.franchise?.tier) - rankTier(a.franchise?.tier);
      if (tr !== 0) return tr;
      const at = a.accreditedAt?.getTime() ?? 0;
      const bt = b.accreditedAt?.getTime() ?? 0;
      return at - bt;
    });
    const topC = centersOk[0];
    if (topC) {
      const t = topC.franchise?.tier ?? "local";
      const base = t === "master" ? 4500 : t === "regional" ? 3000 : 1500;
      const months = topC.accreditedAt
        ? Math.max(0, differenceInCalendarMonths(now, topC.accreditedAt))
        : 0;
      const kc = Math.min(20_000, base + months * 120);
      const lineEn = [topC.franchise?.nameEn, topC.city, topC.countryCode].filter(Boolean).join(" · ");
      const lineAr2 = [topC.franchise?.nameAr ?? topC.franchise?.nameEn, topC.city, topC.countryCode]
        .filter(Boolean)
        .join(" · ");
      excellenceNetwork.center = {
        name: topC.nameEn,
        nameAr: topC.nameAr,
        subtitle: lineEn || topC.nameEn,
        subtitleAr: lineAr2 || (topC.nameAr ?? topC.nameEn),
        kickerPoints: kc,
        mode: "rank",
        avatarUrl: null,
        metrics: [
          { value: "100%" },
          { value: String(months) },
          { value: tierLabel(t, isAr) },
        ],
      };
    }

    const topTrainer = await prisma.employee.findFirst({
      where: { isActive: true, user: { is: { role: "trainer" } } },
      orderBy: { kineticPoints: "desc" },
      include: {
        user: { select: { name: true, nameAr: true, avatarUrl: true } },
        performanceTargets: { where: { isAchieved: true } },
        attendance: {
          where: { date: { gte: monthStart } },
          select: { checkIn: true },
        },
      },
    });
    if (topTrainer) {
      const comp = topTrainer.performanceTargets.length;
      const ac = topTrainer.attendance.filter((a) => a.checkIn != null).length;
      const pct = Math.min(100, Math.round((ac / workingDays) * 100));
      const kpt = topTrainer.kineticPoints ?? 0;
      const jtEn = [topTrainer.jobTitleEn, topTrainer.departmentEn].filter(Boolean).join(" · ");
      const jtAr = [topTrainer.jobTitleAr ?? topTrainer.jobTitleEn, topTrainer.departmentAr ?? topTrainer.departmentEn]
        .filter(Boolean)
        .join(" · ");
      excellenceNetwork.trainer = {
        name: topTrainer.user?.name ?? "—",
        nameAr: topTrainer.user?.nameAr ?? null,
        subtitle: jtEn,
        subtitleAr: jtAr,
        kickerPoints: kpt,
        mode: "avatar",
        avatarUrl: topTrainer.user?.avatarUrl ?? null,
        metrics: [
          { value: String(comp) },
          { value: `${pct}%` },
          { value: scoreLabelFromPoints(kpt) },
        ],
      };
    }
  } catch {
    // DB not available — render with static defaults
  }

  return (
    <NewPublicLanding
      sectors={sectors as Array<{ id: string; code: string; nameEn: string; nameAr: string; color: string | null; iconUrl: string | null }>}
      news={news.map((n) => ({
        id: n.id ?? "",
        titleEn: n.titleEn ?? "",
        titleAr: n.titleAr ?? "",
        imageUrl: n.imageUrl ?? "",
        category: n.category ?? "news",
        publishedAt: (n.publishedAt ?? n.createdAt) ? format(n.publishedAt ?? n.createdAt as Date, "yyyy-MM-dd HH:mm:ss") : "",
      }))}
      events={events.map((e) => ({
        id: e.id ?? "",
        titleEn: e.titleEn ?? "",
        titleAr: e.titleAr ?? "",
        location: e.location ?? "",
        startDate: e.startDate ? format(e.startDate, "yyyy-MM-dd HH:mm:ss") : "",
        eventType: e.eventType ?? "conference",
        coverUrl: e.coverUrl ?? "",
      }))}
      employeeOfMonth={
        employeeOfMonth
          ? {
              id: employeeOfMonth.id ?? "",
              name: employeeOfMonth.user?.name ?? "",
              nameAr: employeeOfMonth.user?.nameAr ?? "",
              avatarUrl: employeeOfMonth.user?.avatarUrl ?? "",
              jobTitleEn: employeeOfMonth.jobTitleEn ?? "",
              jobTitleAr: employeeOfMonth.jobTitleAr ?? "",
              departmentEn: employeeOfMonth.departmentEn ?? "",
              departmentAr: employeeOfMonth.departmentAr ?? "",
              kineticPoints: employeeOfMonth.kineticPoints ?? 0,
              completedProjects: employeeOfMonth._completedProjects ?? 0,
              attendanceCount: employeeOfMonth._attendanceCount ?? 0,
            }
          : null
      }
      excellenceNetwork={excellenceNetwork}
      partners={partners as SuccessPartner[]}
      stats={{
        employees: userCount,
        certificates: certCount,
        agents: agentCount,
        countries: countriesCount,
      }}
    />
  );
}
