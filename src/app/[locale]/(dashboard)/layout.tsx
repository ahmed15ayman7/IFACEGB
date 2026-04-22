import { getLocale } from "next-intl/server";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { EDirectiveOverlay } from "@/components/directives/EDirectiveOverlay";
import { ensureDashboardAccess } from "@/lib/auth/ensure-dashboard-access";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const { session, extraSectorAccess } = await ensureDashboardAccess(locale);

  return (
    <div className="flex min-h-screen">
      <DashboardNav
        role={session.user.role}
        sectorId={session.user.sectorId}
        sectorCode={session.user.sectorCode ?? null}
        locale={locale}
        extraSectorAccess={extraSectorAccess}
      />
      <div className="flex-1 min-w-0">
        {children}
      </div>
      <EDirectiveOverlay userId={session.user.id} locale={locale} />
    </div>
  );
}
