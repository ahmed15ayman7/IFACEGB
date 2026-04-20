import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function TrainerCoursesPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.trainerPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (session.user.role !== "trainer") {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const courses = await prisma.course.findMany({
    where: { createdBy: session.user.id },
    include: { enrollments: true },
    orderBy: { createdAt: "desc" },
  });

  const completedCount = (enrollments: { isCompleted: boolean }[]) =>
    enrollments.filter((e) => e.isCompleted).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("courses_title")}
        </h1>
        <p className="text-[#A8B5C8] mt-1 text-sm">{t("courses_subtitle")}</p>
      </div>

      {courses.length === 0 ? (
        <EmptyState description={t("courses_empty")} />
      ) : (
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(201,162,39,0.1)]">
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_course")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_level")}</th>
                <th className="text-center px-4 py-3 text-[#6e7d93] font-medium">{t("col_enrolled")}</th>
                <th className="text-center px-4 py-3 text-[#6e7d93] font-medium">{t("col_completed")}</th>
                <th className="text-center px-4 py-3 text-[#6e7d93] font-medium">{t("col_published")}</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, i) => (
                <tr
                  key={course.id}
                  className={`border-b border-[rgba(201,162,39,0.06)] ${i % 2 === 0 ? "" : "bg-[rgba(6,15,30,0.3)]"}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{course.titleEn}</p>
                    {course.titleAr && <p className="text-[#6e7d93] text-xs">{course.titleAr}</p>}
                  </td>
                  <td className="px-4 py-3 text-[#A8B5C8] capitalize">{course.level}</td>
                  <td className="px-4 py-3 text-center text-[#A8B5C8]">{course.enrollments.length}</td>
                  <td className="px-4 py-3 text-center text-[#A8B5C8]">
                    {completedCount(course.enrollments)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        course.isPublished
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {course.isPublished ? "Yes" : "No"}
                    </span>
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
