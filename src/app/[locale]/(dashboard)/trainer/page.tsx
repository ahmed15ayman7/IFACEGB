import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function TrainerPortalPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.trainerPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (session.user.role !== "trainer") {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const userId = session.user.id;

  const [accreditation, courses, certificates, wallet] = await Promise.all([
    prisma.accreditationRequest.findFirst({
      where: { applicantId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      where: { createdBy: userId },
      include: { enrollments: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.certificate.findMany({
      where: { issuerId: userId },
      include: { holder: { select: { name: true } } },
      orderBy: { issueDate: "desc" },
      take: 5,
    }),
    prisma.wallet.findFirst({ where: { ownerId: userId } }),
  ]);

  const activeCourses = courses.filter((c) => c.isPublished).length;
  const totalCerts = await prisma.certificate.count({ where: { issuerId: userId } });

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("title")}
        </h1>
        <p className="text-[#A8B5C8] mt-1 text-sm">{t("subtitle")}</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t("kpi_accreditation"), value: accreditation?.status ?? "—" },
          { label: t("kpi_courses"), value: activeCourses },
          { label: t("kpi_certificates"), value: totalCerts },
          { label: t("kpi_wallet"), value: wallet ? Number(wallet.balance).toLocaleString() : "0" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-[rgba(201,162,39,0.06)] border border-[rgba(201,162,39,0.15)] rounded-xl p-4"
          >
            <p className="text-[#6e7d93] text-xs mb-1">{kpi.label}</p>
            <p className="text-[#C9A227] text-xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Courses */}
      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#A8B5C8] font-semibold">{t("courses_title")}</h2>
          <Link href={`/${locale}/trainer/courses`} className="text-[#C9A227] text-sm hover:underline">
            View all →
          </Link>
        </div>
        {courses.length === 0 ? (
          <EmptyState compact />
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-3 bg-[rgba(6,15,30,0.4)] rounded-lg"
              >
                <div>
                  <p className="text-white text-sm font-medium">{course.titleEn}</p>
                  <p className="text-[#6e7d93] text-xs">{course.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#A8B5C8] text-xs">{course.enrollments.length} enrolled</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      course.isPublished
                        ? "bg-green-500/10 text-green-400"
                        : "bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    {course.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Certificates */}
      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#A8B5C8] font-semibold">{t("certificates_title")}</h2>
          <Link href={`/${locale}/trainer/certificates`} className="text-[#C9A227] text-sm hover:underline">
            View all →
          </Link>
        </div>
        {certificates.length === 0 ? (
          <EmptyState compact />
        ) : (
          <div className="space-y-3">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between p-3 bg-[rgba(6,15,30,0.4)] rounded-lg"
              >
                <div>
                  <p className="text-white text-sm font-medium">{cert.holder.name}</p>
                  <p className="text-[#6e7d93] text-xs">{cert.programEn}</p>
                </div>
                <span className="text-[#A8B5C8] text-xs">
                  {new Date(cert.issueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
