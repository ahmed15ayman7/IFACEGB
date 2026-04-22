import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { SovereignGlobeView } from "@/features/god-view/components/SovereignGlobeView";

export default async function GodViewGlobePage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (session.user.role !== "super_admin") {
    redirect(
      getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null, session.user.sectorCode ?? null)
    );
  }

  return (
    <div className="p-2 lg:p-4">
      <SovereignGlobeView />
    </div>
  );
}
