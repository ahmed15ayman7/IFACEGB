import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { IsrNewForm } from "@/components/dashboard/isr/IsrNewForm";

const ALLOWED = ["sector_manager", "admin", "super_admin"];
type Props = { params: Promise<{ slug: string }> };

export default async function SectorRequestsNewPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.isr");
  const ts = await getTranslations("dashboard.sectorPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!ALLOWED.includes(session.user.role))
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));

  const sector = await prisma.sector.findFirst({
    where: { OR: [{ code: slug }, { id: slug }] },
    select: { id: true, nameEn: true, nameAr: true },
  });
  if (!sector) notFound();

  // All sectors except the current one (current sector is the sender)
  const sectors = await prisma.sector.findMany({
    where: { id: { not: sector.id }, isActive: true },
    orderBy: { nameEn: "asc" },
    select: { id: true, nameEn: true, nameAr: true },
  });

  const isRtl = locale === "ar";

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl">
      <div className="flex items-center gap-2">
        <Link
          href={`/${locale}/sector/${slug}/requests`}
          className="text-xs text-[#6e7d93] hover:text-[#C9A227] inline-flex items-center gap-1 transition-colors"
        >
          {isRtl ? <ArrowRight className="size-3.5" aria-hidden /> : <ArrowLeft className="size-3.5" aria-hidden />}
          {ts("requests_title")}
        </Link>
      </div>

      <h1
        className="text-xl font-bold text-[#C9A227]"
        style={{ fontFamily: "var(--font-eb-garamond)" }}
      >
        {t("new_request")}
      </h1>

      <IsrNewForm
        sectors={sectors}
        fromSector={sector}
        redirectTo={`/${locale}/sector/${slug}/requests`}
      />
    </div>
  );
}
