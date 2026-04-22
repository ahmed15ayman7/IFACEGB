import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { UserSectorAccessForm } from "@/components/dashboard/UserSectorAccessForm";

export default async function UserAccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.adminUsers");
  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }
  if (!["super_admin", "admin"].includes(session.user.role)) {
    redirect(
      getRoleHomePath(
        locale,
        session.user.role,
        session.user.sectorId ?? null,
        session.user.sectorCode ?? null
      )
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    notFound();
  }

  const [sectors, existing] = await Promise.all([
    prisma.sector.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, code: true, nameEn: true, nameAr: true },
    }),
    prisma.userSectorAccess.findMany({
      where: { userId: id },
      select: { sectorId: true, accessLevel: true },
    }),
  ]);

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
        {t("access_title")}
      </h1>
      <p className="text-sm text-[#94A3B8]">
        {user.name ?? user.email} <span className="text-[#64748B]">({user.email})</span>
      </p>
      <UserSectorAccessForm
        userId={id}
        sectors={sectors}
        initial={existing}
        locale={locale}
      />
    </div>
  );
}
