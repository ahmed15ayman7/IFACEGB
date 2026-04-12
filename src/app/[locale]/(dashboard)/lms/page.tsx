import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { Headset } from "lucide-react";

export default async function LMSPage() {
  const session = await auth();
  const locale = await getLocale();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const isAr = locale === "ar";
  const userId = session.user.id;

  const [courses, enrollments, vrScenarios] = await Promise.all([
    prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      include: { sector: { select: { nameEn: true } } },
      take: 20,
    }),
    prisma.enrollment.findMany({
      where: { userId },
      include: { course: { select: { titleEn: true, titleAr: true } } },
    }),
    prisma.vrScenario.findMany({ where: { isActive: true }, take: 6 }),
  ]);

  const enrolledIds = new Set(enrollments.map((e) => e.courseId));

  return (
    <div className="p-4 lg:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {isAr ? "منصة التعلم السيادية" : "Sovereign LMS"}
        </h1>
        <p className="text-[#6e7d93] text-sm mt-1">
          {isAr ? "دورات تدريبية، مختبرات VR، موسوعة المعرفة، وخارطة المسار المهني." : "Courses, VR labs, knowledge encyclopedia, and AI career roadmaps."}
        </p>
      </div>

      {/* My Progress */}
      {enrollments.length > 0 && (
        <section>
          <h2 className="text-[#C9A227] font-semibold mb-3" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {isAr ? "مساراتي التعليمية" : "My Learning Progress"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {enrollments.map((enr) => (
              <div
                key={enr.id}
                className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4"
              >
                <h3 className="text-[#A8B5C8] text-sm font-medium mb-2">
                  {isAr ? enr.course.titleAr ?? enr.course.titleEn : enr.course.titleEn}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[rgba(201,162,39,0.1)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${enr.progress}%`, background: "#C9A227" }}
                    />
                  </div>
                  <span className="text-xs text-[#6e7d93]">{enr.progress}%</span>
                </div>
                {enr.isCompleted && (
                  <span className="text-xs text-[#22c55e] mt-1 block">✓ Completed</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available Courses */}
      <section>
        <h2 className="text-[#C9A227] font-semibold mb-3" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {isAr ? "الدورات المتاحة" : "Available Courses"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(10,31,61,0.4)] overflow-hidden hover:border-[rgba(201,162,39,0.25)] transition-all group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(201,162,39,0.1)] text-[#C9A227] border border-[rgba(201,162,39,0.2)]">
                    {course.sector?.nameEn ?? "General"}
                  </span>
                  <span className="text-xs text-[#6e7d93]">{course.level}</span>
                </div>
                <h3 className="text-[#A8B5C8] font-semibold text-sm group-hover:text-[#C9A227] transition-colors mb-1">
                  {isAr ? course.titleAr ?? course.titleEn : course.titleEn}
                </h3>
                <p className="text-[#6e7d93] text-xs line-clamp-2">
                  {isAr ? course.descriptionAr ?? course.descriptionEn : course.descriptionEn}
                </p>
                {course.durationHours && (
                  <p className="text-[#6e7d93] text-xs mt-2">⏱ {course.durationHours}h</p>
                )}
              </div>
              <div className="px-5 pb-4">
                {enrolledIds.has(course.id) ? (
                  <Link
                    href={`/${locale}/lms/course/${course.id}`}
                    className="w-full h-8 flex items-center justify-center text-xs rounded-lg bg-[rgba(34,197,94,0.1)] text-[#22c55e] border border-[rgba(34,197,94,0.2)]"
                  >
                    Continue Learning →
                  </Link>
                ) : (
                  <Link
                    href={`/${locale}/lms/course/${course.id}`}
                    className="w-full h-8 flex items-center justify-center text-xs rounded-lg bg-[rgba(201,162,39,0.1)] text-[#C9A227] border border-[rgba(201,162,39,0.2)] hover:bg-[rgba(201,162,39,0.15)] transition-colors"
                  >
                    {isAr ? "ابدأ الآن" : "Enroll Now"}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VR Lab */}
      <section>
        <h2 className="text-[#C9A227] font-semibold mb-3" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {isAr ? "المختبر الافتراضي (VR)" : "VR Lab Scenarios"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {vrScenarios.map((scenario) => (
            <Link
              key={scenario.id}
              href={`/${locale}/lms/vr/${scenario.id}`}
              className="p-4 rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(10,31,61,0.4)] hover:border-[rgba(201,162,39,0.3)] transition-all"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-[rgba(201,162,39,0.1)] text-[#C9A227] border border-[rgba(201,162,39,0.15)] mb-2">
                <Headset className="size-5" aria-hidden />
              </span>
              <h3 className="text-[#A8B5C8] text-sm font-medium">
                {isAr ? scenario.titleAr ?? scenario.titleEn : scenario.titleEn}
              </h3>
              <p className="text-[#6e7d93] text-xs mt-1 flex items-center gap-2">
                <span>{scenario.category}</span>
                <span>·</span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{
                    background: scenario.difficulty === "hard" ? "rgba(156,42,42,0.2)" : "rgba(201,162,39,0.1)",
                    color: scenario.difficulty === "hard" ? "#9C2A2A" : "#C9A227",
                  }}
                >
                  {scenario.difficulty}
                </span>
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
