import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { canAccessGeneralAdminDashboard } from "@/lib/auth/general-admin-allowed";
import { format } from "date-fns";

type Props = { searchParams: Promise<{ view?: string }> };

export default async function GeneralAdminClientsPage({ searchParams }: Props) {
  const session = await auth();
  const locale = await getLocale();
  const sp = await searchParams;
  const view = sp.view === "pr" ? "pr" : "secretariat";
  const t = await getTranslations("dashboard.generalAdminClients");
  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (
    !(await canAccessGeneralAdminDashboard(
      session.user.role,
      session.user.sectorId ?? null,
      session.user.sectorCode ?? null
    ))
  ) {
    redirect(`/${locale}/dashboard`);
  }

  const clients = await prisma.user.findMany({
    where: { role: "client" },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      name: true,
      email: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  const ticketCounts = await prisma.supportTicket.groupBy({
    by: ["requesterId"],
    where: { status: { in: ["open", "in_progress"] } },
    _count: { id: true },
  });
  const openByUser = Object.fromEntries(ticketCounts.map((x) => [x.requesterId, x._count.id]));

  return (
    <main className="p-6 space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-wrap gap-2">
        <a
          href={`?view=secretariat`}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
            view === "secretariat"
              ? "bg-[#C9A227]/20 border-[#C9A227] text-[#C9A227]"
              : "border-[#1E293B] text-[#94A3B8]"
          }`}
        >
          {t("tab_secretariat")}
        </a>
        <a
          href={`?view=pr`}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
            view === "pr"
              ? "bg-[#C9A227]/20 border-[#C9A227] text-[#C9A227]"
              : "border-[#1E293B] text-[#94A3B8]"
          }`}
        >
          {t("tab_pr")}
        </a>
      </div>

      <div>
        <h1 className="text-xl font-bold text-white">{t("title")}</h1>
        <p className="text-sm text-[#64748B] mt-1">{t("subtitle")}</p>
      </div>

      {view === "secretariat" ? (
        <div className="rounded-xl border border-[#1E293B] overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-[#0A0F1A] text-[#94A3B8] text-xs">
                <th className="px-4 py-3 text-left">{t("col_name")}</th>
                <th className="px-4 py-3 text-left">{t("col_email")}</th>
                <th className="px-4 py-3 text-left">{t("col_open_tickets")}</th>
                <th className="px-4 py-3 text-left">{t("col_last_login")}</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t border-[#1E293B]">
                  <td className="px-4 py-3 text-[#A8B5C8]">{c.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-[#64748B]">{c.email}</td>
                  <td className="px-4 py-3 text-xs">{openByUser[c.id] ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-[#64748B]">
                    {c.lastLoginAt ? format(c.lastLoginAt, "PP") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-[#1E293B] bg-[#0A0F1A] p-4 hover:border-[#C9A227]/30 transition-colors"
            >
              <p className="text-white font-semibold text-sm">{c.name ?? c.email}</p>
              <p className="text-xs text-[#64748B] mt-1">{c.email}</p>
              <p className="text-xs text-[#94A3B8] mt-2">
                {t("open_tickets")}: {openByUser[c.id] ?? 0}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
