"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Star } from "lucide-react";
import {
  ExcellenceNetworkSection,
  type ExcellenceNetworkData,
} from "./ExcellenceNetworkSection";

interface EmployeeOfMonth {
  id: string;
  name: string;
  nameAr: string | null;
  avatarUrl: string | null;
  jobTitleEn: string | null;
  jobTitleAr: string | null;
  departmentEn: string | null;
  departmentAr: string | null;
  kineticPoints: number;
  completedProjects: number;
  attendanceCount: number;
}

interface EmployeeOfMonthSectionProps {
  employee: EmployeeOfMonth | null;
  excellenceNetwork: ExcellenceNetworkData;
}

function getStarRating(points: number): number {
  if (points >= 5000) return 5;
  if (points >= 3000) return 4.5;
  if (points >= 1500) return 4;
  if (points >= 500) return 3;
  return 2;
}

function getLevel(points: number): "legend" | "platinum" | "gold" | "silver" | "bronze" {
  if (points >= 5000) return "legend";
  if (points >= 3000) return "platinum";
  if (points >= 1500) return "gold";
  if (points >= 500) return "silver";
  return "bronze";
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={16}
          className={s <= Math.floor(rating) ? "fill-[#C9A227] text-[#C9A227]" : s <= rating ? "fill-[#C9A227]/50 text-[#C9A227]" : "text-[#334155]"}
        />
      ))}
    </div>
  );
}

export function EmployeeOfMonthSection({ employee, excellenceNetwork }: EmployeeOfMonthSectionProps) {
  const t = useTranslations("landing.eom");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const WORKING_DAYS = 22;

  return (
    <section className="py-20 bg-[#030B15]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-[#C9A227] text-xs font-semibold uppercase tracking-widest mb-3 block">
            {t("kicker")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" dir={isRTL ? "rtl" : "ltr"}>
            {t("title")}
          </h2>
        </motion.div>

        {employee ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-md mx-auto"
          >
            <div
              className="relative flex flex-col items-center gap-5 p-8 rounded-2xl border bg-[#0A0F1A]"
              style={{
                borderColor: "#C9A227",
                boxShadow: "0 0 40px rgba(201,162,39,0.2), 0 0 80px rgba(201,162,39,0.08)",
              }}
            >
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#C9A227] text-black text-xs font-bold whitespace-nowrap">
                {t("badge")}
              </div>

              {/* Avatar */}
              <div className="relative mt-3">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden border-4"
                  style={{ borderColor: "#C9A227" }}
                >
                  {employee.avatarUrl ? (
                    <Image
                      src={employee.avatarUrl}
                      alt={employee.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#C9A227]/20 flex items-center justify-center text-[#C9A227] text-3xl font-bold">
                      {(locale === "ar" && employee.nameAr ? employee.nameAr : employee.name).charAt(0)}
                    </div>
                  )}
                </div>
                {/* Glow ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ boxShadow: "0 0 20px rgba(201,162,39,0.4)" }}
                />
              </div>

              {/* Name */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-1" dir={isRTL ? "rtl" : "ltr"}>
                  {locale === "ar" && employee.nameAr ? employee.nameAr : employee.name}
                </h3>
                <p className="text-[#94A3B8] text-sm" dir={isRTL ? "rtl" : "ltr"}>
                  {locale === "ar" && employee.jobTitleAr
                    ? employee.jobTitleAr
                    : employee.jobTitleEn ?? ""}
                  {(employee.departmentAr || employee.departmentEn) && (
                    <span className="text-[#64748B]">
                      {" • "}
                      {locale === "ar" && employee.departmentAr
                        ? employee.departmentAr
                        : employee.departmentEn}
                    </span>
                  )}
                </p>
              </div>

              {/* Star rating */}
              <div className="flex flex-col items-center gap-1">
                <StarRating rating={getStarRating(employee.kineticPoints)} />
                <span className="text-[#C9A227] text-xs font-medium">{t(getLevel(employee.kineticPoints))}</span>
              </div>

              {/* KPI chips */}
              <div className="grid grid-cols-3 gap-3 w-full">
                <div className="flex flex-col items-center p-3 rounded-xl bg-[#0F172A] border border-[#1E293B]">
                  <span className="text-[#C9A227] text-lg font-bold">{employee.completedProjects}</span>
                  <span className="text-[#64748B] text-[10px] text-center leading-tight mt-1">{t("kpi_projects")}</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl bg-[#0F172A] border border-[#1E293B]">
                  <span className="text-[#C9A227] text-lg font-bold">
                    {Math.min(100, Math.round((employee.attendanceCount / WORKING_DAYS) * 100))}%
                  </span>
                  <span className="text-[#64748B] text-[10px] text-center leading-tight mt-1">{t("kpi_activity")}</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl bg-[#0F172A] border border-[#1E293B]">
                  <span className="text-[#C9A227] text-lg font-bold">{getStarRating(employee.kineticPoints)}</span>
                  <span className="text-[#64748B] text-[10px] text-center leading-tight mt-1">{t("kpi_rating")}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <p className="text-center text-[#64748B]">{t("no_data")}</p>
        )}

        <ExcellenceNetworkSection data={excellenceNetwork} />
      </div>
    </section>
  );
}
