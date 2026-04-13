import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CalendarCheck } from "lucide-react";
import { AttendanceClient } from "@/components/dashboard/AttendanceClient";

export default async function EmployeeAttendancePage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.employeeAttendance");

  if (!session?.user) redirect(`/${locale}/auth/login`);

  const employee = await prisma.employee.findUnique({ where: { userId: session.user.id } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRecord = employee
    ? await prisma.attendance.findUnique({
        where: { employeeId_date: { employeeId: employee.id, date: today } },
      })
    : null;

  const history = employee
    ? await prisma.attendance.findMany({
        where: { employeeId: employee.id },
        orderBy: { date: "desc" },
        take: 30,
      })
    : [];

  const isRtl = locale === "ar";

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-[rgba(201,162,39,0.25)] bg-[rgba(201,162,39,0.1)] text-[#C9A227]">
          <CalendarCheck className="size-5" strokeWidth={1.4} aria-hidden />
        </div>
        <div>
          <h1
            className="text-xl font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("title")}
          </h1>
          <p className="text-xs text-[#6e7d93]">{t("subtitle")}</p>
        </div>
      </div>

      <AttendanceClient
        today={
          todayRecord
            ? {
                id: todayRecord.id,
                checkIn: todayRecord.checkIn ? todayRecord.checkIn.toISOString() : null,
                checkOut: todayRecord.checkOut ? todayRecord.checkOut.toISOString() : null,
                status: todayRecord.status,
                isGeofenced: todayRecord.isGeofenced,
                lateMinutes: todayRecord.lateMinutes,
              }
            : null
        }
      />

      <div>
        <h2 className="text-[#C9A227] font-semibold mb-3" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("history_title")}
        </h2>

        {history.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#6e7d93]">{t("empty")}</p>
        ) : (
          <div className="rounded-xl border border-[rgba(201,162,39,0.12)] overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="bg-[rgba(10,31,61,0.8)] border-b border-[rgba(201,162,39,0.1)]">
                  {[t("col_date"), t("col_check_in"), t("col_check_out"), t("col_late"), t("col_status")].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#6e7d93] uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(201,162,39,0.06)]">
                {history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[rgba(201,162,39,0.02)]">
                    <td className="px-4 py-3 text-xs text-[#A8B5C8]">
                      {new Date(rec.date).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#22c55e] font-mono">
                      {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString(isRtl ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#ef4444] font-mono">
                      {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString(isRtl ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6e7d93]">
                      {rec.lateMinutes > 0 ? <span className="text-[#f97316]">{rec.lateMinutes}</span> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: rec.status === "present" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          color: rec.status === "present" ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
