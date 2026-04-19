import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, AlertTriangle } from "lucide-react";
import { IsrDetailClient } from "@/components/dashboard/isr/IsrDetailClient";

const ALLOWED = ["sector_manager", "admin", "super_admin"];

type Props = { params: Promise<{ id: string; locale: string }> };

export default async function IsrDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.isr");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!ALLOWED.includes(session.user.role))
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));

  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { name: true, nameAr: true, email: true } },
      sector: { select: { nameEn: true, nameAr: true } },
    },
  });

  if (!request) notFound();

  const isRtl = locale === "ar";
  const title = isRtl ? (request.titleAr ?? request.titleEn) : request.titleEn;
  const desc = isRtl ? (request.descriptionAr ?? request.descriptionEn) : request.descriptionEn;

  const now = Date.now();
  const deadline = request.slaDeadline ? new Date(request.slaDeadline).getTime() : null;
  const msLeft = deadline ? deadline - now : null;
  const isOverdue = msLeft !== null && msLeft < 0;
  const hLeft = msLeft !== null && msLeft > 0 ? Math.floor(msLeft / 3600000) : 0;
  const mLeft = msLeft !== null && msLeft > 0 ? Math.floor((msLeft % 3600000) / 60000) : 0;

  const isSender = request.fromSectorId === session.user.sectorId;
  const isReceiver = request.toSectorId === session.user.sectorId;
  const canAct = (isReceiver || session.user.role !== "sector_manager") &&
    !["resolved", "rejected"].includes(request.status);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl">
      <Link
        href={`/${locale}/isr`}
        className="text-xs text-[#6e7d93] hover:text-[#C9A227] inline-flex items-center gap-1 transition-colors"
      >
        {isRtl ? <ArrowRight className="size-3.5" aria-hidden /> : <ArrowLeft className="size-3.5" aria-hidden />}
        {t("back_to_inbox")}
      </Link>

      <div className="rounded-2xl border border-[rgba(201,162,39,0.15)] bg-[rgba(6,15,30,0.6)] p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#6e7d93]">
              {request.type.replace("_", " ")} · {request.priority}
            </span>
            <h1
              className="mt-1 text-2xl font-bold text-[#C9A227]"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {title}
            </h1>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full border border-[rgba(201,162,39,0.25)] text-[#C9A227] bg-[rgba(201,162,39,0.08)]">
            {t(`status_${request.status.replace("_", "") as "pending"}`)}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-[#A8B5C8]">{desc}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#6e7d93]">
          <div>
            <span className="text-[#C9A227] font-medium">{t("detail_from")}: </span>
            {isRtl ? (request.requester.nameAr ?? request.requester.name ?? "—") : (request.requester.name ?? "—")}
          </div>
          {request.sector && (
            <div>
              <span className="text-[#C9A227] font-medium">{t("detail_to")}: </span>
              {isRtl ? (request.sector.nameAr ?? request.sector.nameEn) : request.sector.nameEn}
            </div>
          )}
          <div>
            <span className="text-[#C9A227] font-medium">{t("detail_created")}: </span>
            {new Date(request.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          {request.slaDeadline && (
            <div className={`flex items-center gap-1 ${isOverdue ? "text-red-400" : "text-[#C9A227]/80"}`}>
              {isOverdue ? <AlertTriangle className="size-3" aria-hidden /> : <Clock className="size-3" aria-hidden />}
              <span className="text-[#C9A227] font-medium">{t("sla_label")}: </span>
              {isOverdue ? t("sla_overdue") : t("sla_remaining", { h: hLeft, m: mLeft })}
            </div>
          )}
          {request.assignedTo && (
            <div>
              <span className="text-[#C9A227] font-medium">{t("detail_assigned")}: </span>
              {request.assignedTo}
            </div>
          )}
        </div>

        {request.resolution && (
          <div className="rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(201,162,39,0.05)] p-4">
            <p className="text-xs font-semibold text-[#C9A227] mb-1">{t("detail_resolution")}</p>
            <p className="text-sm text-[#A8B5C8]">{request.resolution}</p>
          </div>
        )}
      </div>

      {canAct && (
        <IsrDetailClient
          id={id}
          locale={locale}
          statuses={["accepted", "rejected", "in_progress", "resolved", "escalated"]}
        />
      )}
    </div>
  );
}
