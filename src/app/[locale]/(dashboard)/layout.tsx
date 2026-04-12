import { auth } from "@/lib/auth/auth.config";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { EDirectiveOverlay } from "@/components/directives/EDirectiveOverlay";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }

  return (
    <div className="flex min-h-screen">
      <DashboardNav role={session.user.role} sectorId={session.user.sectorId} locale={locale} />
      <div className="flex-1 min-w-0">
        {children}
      </div>
      <EDirectiveOverlay userId={session.user.id} locale={locale} />
    </div>
  );
}
