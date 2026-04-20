import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ClientCoursesPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.clientPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (session.user.role !== "client") {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: { course: { select: { titleEn: true, titleAr: true, level: true, durationHours: true } } },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("courses_title")}
        </h1>
        <p className="text-[#A8B5C8] mt-1 text-sm">{t("courses_subtitle")}</p>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState description={t("courses_empty")} />
      ) : (
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(201,162,39,0.1)]">
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_course")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_progress")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_completed")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_enrolled")}</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enr, i) => (
                <tr
                  key={enr.id}
                  className={`border-b border-[rgba(201,162,39,0.06)] ${i % 2 === 0 ? "" : "bg-[rgba(6,15,30,0.3)]"}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{enr.course.titleEn}</p>
                    {enr.course.titleAr && (
                      <p className="text-[#6e7d93] text-xs">{enr.course.titleAr}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#C9A227] rounded-full"
                          style={{ width: `${enr.progress}%` }}
                        />
                      </div>
                      <span className="text-[#C9A227] text-xs font-semibold w-10 text-right">
                        {enr.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {enr.isCompleted ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                        Yes
                      </span>
                    ) : (
                      <span className="text-xs text-[#6e7d93]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#6e7d93] text-xs">
                    {new Date(enr.enrolledAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
