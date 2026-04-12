import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

/** Role router: sends each user to their real home in one hop (no fallback to /employee). */
export default async function DashboardRedirect() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect(`/${locale}/auth/login`);

  redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
}
