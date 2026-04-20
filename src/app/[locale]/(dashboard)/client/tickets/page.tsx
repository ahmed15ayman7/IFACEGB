import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { TicketsClient } from "@/components/dashboard/TicketsClient";

export default async function ClientTicketsPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.clientPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (session.user.role !== "client") {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { requesterId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const serialized = tickets.map((tk) => ({
    ...tk,
    createdAt: tk.createdAt.toISOString(),
    updatedAt: tk.updatedAt.toISOString(),
    resolvedAt: tk.resolvedAt?.toISOString() ?? null,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("tickets_title")}
        </h1>
        <p className="text-[#A8B5C8] mt-1 text-sm">{t("tickets_subtitle")}</p>
      </div>
      <TicketsClient initialTickets={serialized} namespace="dashboard.clientPortal" />
    </div>
  );
}
