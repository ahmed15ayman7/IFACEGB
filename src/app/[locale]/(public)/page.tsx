import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import { prisma } from "@/lib/prisma";
import { NewPublicLanding } from "@/components/landing/NewPublicLanding";
import { startOfMonth } from "date-fns";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("home", locale as "en" | "ar");
}

export default async function LandingPage() {
  const now = new Date();
  const monthStart = startOfMonth(now);

  let sectors: Awaited<ReturnType<typeof prisma.sector.findMany>> = [];
  let news: Awaited<ReturnType<typeof prisma.ifaceNews.findMany>> = [];
  let events: Awaited<ReturnType<typeof prisma.ifaceEvent.findMany>> = [];
  let employeeOfMonth: (Awaited<ReturnType<typeof prisma.employee.findFirst>> & {
    _attendanceCount?: number;
    _completedProjects?: number;
  }) | null = null;
  let partners: Awaited<ReturnType<typeof prisma.successPartner.findMany>> = [];
  let userCount = 0;
  let certCount = 0;
  let agentCount = 0;
  let countriesCount = 0;

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
  } catch {
    // DB not available — render with static defaults
  }

  return (
    <NewPublicLanding
      sectors={sectors as Array<{ id: string; code: string; nameEn: string; nameAr: string; color: string | null; iconUrl: string | null }>}
      news={news.map((n) => ({
        id: n.id,
        titleEn: n.titleEn,
        titleAr: n.titleAr ?? null,
        imageUrl: n.imageUrl ?? null,
        category: n.category ?? "news",
        publishedAt: (n.publishedAt ?? n.createdAt).toISOString(),
      }))}
      events={events.map((e) => ({
        id: e.id,
        titleEn: e.titleEn,
        titleAr: e.titleAr ?? null,
        location: e.location ?? null,
        startDate: e.startDate.toISOString(),
        eventType: e.eventType ?? "conference",
        coverUrl: e.coverUrl ?? null,
      }))}
      employeeOfMonth={
        employeeOfMonth
          ? {
              id: employeeOfMonth.id,
              name: employeeOfMonth.user.name ?? "",
              nameAr: employeeOfMonth.user.nameAr ?? null,
              avatarUrl: employeeOfMonth.user.avatarUrl ?? null,
              jobTitleEn: employeeOfMonth.jobTitleEn ?? null,
              jobTitleAr: employeeOfMonth.jobTitleAr ?? null,
              departmentEn: employeeOfMonth.departmentEn ?? null,
              departmentAr: employeeOfMonth.departmentAr ?? null,
              kineticPoints: employeeOfMonth.kineticPoints,
              completedProjects: employeeOfMonth._completedProjects ?? 0,
              attendanceCount: employeeOfMonth._attendanceCount ?? 0,
            }
          : null
      }
      partners={partners}
      stats={{
        employees: userCount,
        certificates: certCount,
        agents: agentCount,
        countries: countriesCount,
      }}
    />
  );
}
