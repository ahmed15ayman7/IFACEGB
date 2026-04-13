import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Plus, Inbox } from "lucide-react";
import { IsrInboxClient } from "@/components/dashboard/isr/IsrInboxClient";
import { fadeInUp } from "@/lib/motion/dashboard";
import { motion } from "framer-motion";

const ALLOWED = ["sector_manager", "admin", "super_admin"];

export default async function IsrPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.isr");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!ALLOWED.includes(session.user.role))
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));

  const sectorId = session.user.sectorId ?? undefined;
  const isAdmin = session.user.role === "super_admin" || session.user.role === "admin";

  const [inbox, sent] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: isAdmin ? {} : { toSectorId: sectorId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        requester: { select: { name: true, nameAr: true } },
        sector: { select: { nameEn: true, nameAr: true } },
      },
    }),
    prisma.serviceRequest.findMany({
      where: isAdmin ? { fromSectorId: { not: sectorId } } : { fromSectorId: sectorId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        requester: { select: { name: true, nameAr: true } },
        sector: { select: { nameEn: true, nameAr: true } },
      },
    }),
  ]);

  const serialize = <T extends { createdAt: Date; slaDeadline?: Date | null }>(items: T[]) =>
    items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      slaDeadline: item.slaDeadline ? item.slaDeadline.toISOString() : null,
    }));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-[rgba(201,162,39,0.25)] bg-[rgba(201,162,39,0.1)] text-[#C9A227]">
            <Inbox className="size-5" strokeWidth={1.4} aria-hidden />
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
        <Link
          href={`/${locale}/isr/new`}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-[rgba(201,162,39,0.9)] px-4 text-xs font-semibold text-[#060f1e] hover:bg-[#C9A227] transition-colors"
        >
          <Plus className="size-3.5" aria-hidden />
          {t("new_request")}
        </Link>
      </div>

      <IsrInboxClient inbox={serialize(inbox)} sent={serialize(sent)} />
    </div>
  );
}
