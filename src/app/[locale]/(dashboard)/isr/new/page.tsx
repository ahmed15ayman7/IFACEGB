import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { IsrNewForm } from "@/components/dashboard/isr/IsrNewForm";

const ALLOWED = ["sector_manager", "admin", "super_admin"];

export default async function IsrNewPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.isr");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!ALLOWED.includes(session.user.role))
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));

  const sectors = await prisma.sector.findMany({
    orderBy: { nameEn: "asc" },
    select: { id: true, nameEn: true, nameAr: true },
  });

  const isRtl = locale === "ar";

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/isr`}
          className="text-xs text-[#6e7d93] hover:text-[#C9A227] inline-flex items-center gap-1 transition-colors"
        >
          {isRtl ? <ArrowRight className="size-3.5" aria-hidden /> : <ArrowLeft className="size-3.5" aria-hidden />}
          {t("back_to_inbox")}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-[rgba(201,162,39,0.25)] bg-[rgba(201,162,39,0.1)] text-[#C9A227]">
          <Plus className="size-5" strokeWidth={1.4} aria-hidden />
        </div>
        <h1
          className="text-xl font-bold text-[#C9A227]"
          style={{ fontFamily: "var(--font-eb-garamond)" }}
        >
          {t("new_request")}
        </h1>
      </div>

      <IsrNewForm sectors={sectors} />
    </div>
  );
}
