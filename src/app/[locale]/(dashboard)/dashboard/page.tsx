import { auth } from "@/lib/auth/auth.config";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

export default async function DashboardRedirect() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect(`/${locale}/auth/login`);

  const { role, sectorId } = session.user;

  if (role === "super_admin") redirect(`/${locale}/god-view`);
  if (role === "sector_manager" && sectorId) redirect(`/${locale}/sector/${sectorId}`);
  if (role === "employee" || role === "trainer") redirect(`/${locale}/employee`);
  if (role === "agent") redirect(`/${locale}/franchise`);
  if (role === "admin") redirect(`/${locale}/admin/employees`);

  // Fallback
  redirect(`/${locale}/employee`);
}
