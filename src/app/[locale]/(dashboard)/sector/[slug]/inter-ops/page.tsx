import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Link2, CheckCircle2, Clock } from "lucide-react";

const ALLOWED = ["sector_manager", "admin", "super_admin"];
type Props = { params: Promise<{ slug: string }> };

export default async function SectorInterOpsPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.sectorPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!ALLOWED.includes(session.user.role))
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));

  const sector = await prisma.sector.findFirst({
    where: { OR: [{ code: slug }, { id: slug }] },
    select: { id: true, nameEn: true, nameAr: true },
  });
  if (!sector) notFound();

  // Fetch all internal invoices where this sector is sender OR receiver
  const invoices = await prisma.internalInvoice.findMany({
    where: {
      OR: [{ fromSectorId: sector.id }, { toSectorId: sector.id }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Fetch sector names for display
  const sectorIds = new Set<string>();
  invoices.forEach((inv) => {
    sectorIds.add(inv.fromSectorId);
    sectorIds.add(inv.toSectorId);
  });
  const sectorMap = await prisma.sector
    .findMany({
      where: { id: { in: Array.from(sectorIds) } },
      select: { id: true, nameEn: true, nameAr: true },
    })
    .then((rows) => Object.fromEntries(rows.map((r) => [r.id, r])));

  const isRtl = locale === "ar";
  const sectorName = isRtl ? (sector.nameAr ?? sector.nameEn) : sector.nameEn;

  const totalReceivable = invoices
    .filter((i) => i.toSectorId === sector.id && !i.isPaid)
    .reduce((s, i) => s + Number(i.amountCoins), 0);
  const totalPayable = invoices
    .filter((i) => i.fromSectorId === sector.id && !i.isPaid)
    .reduce((s, i) => s + Number(i.amountCoins), 0);

  function getSectorLabel(id: string) {
    const s = sectorMap[id];
    if (!s) return id.slice(0, 8) + "…";
    return isRtl ? (s.nameAr ?? s.nameEn) : s.nameEn;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/sector/${slug}`}
          className="text-xs text-[#6e7d93] hover:text-[#C9A227] inline-flex items-center gap-1 transition-colors"
        >
          {isRtl ? <ArrowRight className="size-3.5" aria-hidden /> : <ArrowLeft className="size-3.5" aria-hidden />}
          {sectorName}
        </Link>
        <span className="text-[#6e7d93] opacity-40">·</span>
        <div className="flex items-center gap-2">
          <Link2 className="size-4 text-[#C9A227]" aria-hidden />
          <h1
            className="text-lg font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("interops_title")}
          </h1>
        </div>
      </div>

      <p className="text-xs text-[#6e7d93]">{t("interops_subtitle")}</p>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[rgba(201,162,39,0.15)] bg-[rgba(6,15,30,0.6)] p-4">
          <p className="text-xs text-[#6e7d93] mb-1">Total Invoices</p>
          <p className="text-3xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {invoices.length}
          </p>
        </div>
        <div className="rounded-xl border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.04)] p-4">
          <p className="text-xs text-[#6e7d93] mb-1">Receivable (coins)</p>
          <p className="text-3xl font-bold text-[#22c55e]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {totalReceivable.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.04)] p-4">
          <p className="text-xs text-[#6e7d93] mb-1">Payable (coins)</p>
          <p className="text-3xl font-bold text-red-400" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {totalPayable.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Invoice table */}
      {invoices.length === 0 ? (
        <p className="py-16 text-center text-sm text-[#6e7d93]">{t("interops_empty")}</p>
      ) : (
        <div className="rounded-xl border border-[rgba(201,162,39,0.12)] overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-[rgba(10,31,61,0.8)] border-b border-[rgba(201,162,39,0.1)]">
                {[
                  t("interops_col_from"),
                  t("interops_col_to"),
                  t("interops_col_amount"),
                  t("interops_col_desc"),
                  t("interops_col_paid"),
                  "Date",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#6e7d93] uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(201,162,39,0.06)]">
              {invoices.map((inv) => {
                const isIncoming = inv.toSectorId === sector.id;
                return (
                  <tr key={inv.id} className="hover:bg-[rgba(201,162,39,0.02)]">
                    <td className="px-4 py-3 text-xs text-[#A8B5C8]">
                      {getSectorLabel(inv.fromSectorId)}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#A8B5C8]">
                      {getSectorLabel(inv.toSectorId)}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-sm" style={{ color: isIncoming ? "#22c55e" : "#ef4444" }}>
                      {isIncoming ? "+" : "-"}{Number(inv.amountCoins).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6e7d93] max-w-[200px] truncate">
                      {inv.description?.slice(0, 60) ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${inv.isPaid ? "text-[#22c55e] border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.08)]" : "text-[#C9A227] border-[rgba(201,162,39,0.25)] bg-[rgba(201,162,39,0.08)]"}`}>
                        {inv.isPaid ? <CheckCircle2 className="size-3" aria-hidden /> : <Clock className="size-3" aria-hidden />}
                        {inv.isPaid ? t("interops_paid") : t("interops_unpaid")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6e7d93]">
                      {new Date(inv.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
