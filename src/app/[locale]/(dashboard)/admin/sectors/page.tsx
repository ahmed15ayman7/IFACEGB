import { auth } from "@/lib/auth/auth.config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Plus } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.sectors" });
  return { title: t("title") };
}

export default async function AdminSectorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user) redirect(`/${locale}/login`);
  if (!["super_admin", "admin"].includes(session.user.role)) redirect(`/${locale}/dashboard`);

  const t = await getTranslations({ locale, namespace: "dashboard.sectors" });

  const sectors = await prisma.sector.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { employees: true, users: true } },
      wallets: {
        where: { walletType: "SectorWallet" },
        select: { balanceCoins: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#060f1e] text-white px-4 sm:px-6 lg:px-10 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-white/50 mt-1">{sectors.length} sectors</p>
        </div>
        <Link
          href={`/${locale}/admin/sectors/new`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#e8c547] text-[#060f1e] font-semibold text-sm hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          {t("add_sector")}
        </Link>
      </div>

      {sectors.length === 0 ? (
        <p className="text-white/40 text-center py-20">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sectors.map((s) => {
            const balance = s.wallets[0]?.balanceCoins ?? 0;
            return (
              <Link
                key={s.id}
                href={`/${locale}/sector/${s.code}`}
                className="group block bg-[#0d1929] border border-white/10 rounded-2xl p-5 hover:border-[#C9A227]/40 transition-all"
              >
                {/* Color bar */}
                <div
                  className="w-full h-1 rounded-full mb-4"
                  style={{ backgroundColor: s.color }}
                />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-white font-semibold text-base group-hover:text-[#C9A227] transition-colors">
                      {locale === "ar" ? s.nameAr : s.nameEn}
                    </h3>
                    <span className="text-xs text-white/40 font-mono">{s.code}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}
                  >
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {s.description && (
                  <p className="text-sm text-white/40 mt-2 line-clamp-2">{s.description}</p>
                )}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/5 rounded-xl py-2">
                    <p className="text-xs text-white/40">Employees</p>
                    <p className="text-white font-semibold text-sm">{s._count.employees}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl py-2">
                    <p className="text-xs text-white/40">Users</p>
                    <p className="text-white font-semibold text-sm">{s._count.users}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl py-2">
                    <p className="text-xs text-white/40">Wallet</p>
                    <p className="text-[#C9A227] font-semibold text-sm">
                      {Number(balance).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
