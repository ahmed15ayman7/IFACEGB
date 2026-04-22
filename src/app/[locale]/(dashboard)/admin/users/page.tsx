import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { format } from "date-fns";
import { AdminUsersClient, type UserRow } from "@/components/dashboard/AdminUsersClient";

export default async function AdminUsersPage() {
  const session = await auth();
  const locale = await getLocale();
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

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 2000,
    include: { sector: { select: { nameEn: true, nameAr: true } } },
  });

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    isSuspended: u.isSuspended,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    sector: u.sector,
  }));

  const roleMap = new Map<string, number>();
  for (const u of users) {
    roleMap.set(u.role, (roleMap.get(u.role) ?? 0) + 1);
  }
  const byRole = Array.from(roleMap.entries()).map(([role, count]) => ({ role, count }));

  let activeN = 0;
  let susN = 0;
  let inaN = 0;
  for (const u of users) {
    if (!u.isActive) inaN++;
    else if (u.isSuspended) susN++;
    else activeN++;
  }
  const statusMix = [
    { name: "Active", value: activeN, color: "#22C55E" },
    { name: "Suspended", value: susN, color: "#F59E0B" },
    { name: "Inactive", value: inaN, color: "#EF4444" },
  ];

  const monthKey = (d: Date) => format(d, "yyyy-MM");
  const signups = new Map<string, number>();
  for (const u of users) {
    const k = monthKey(u.createdAt);
    signups.set(k, (signups.get(k) ?? 0) + 1);
  }
  const byMonth = Array.from(signups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, count]) => ({ month, count }));

  const sectorMap = new Map<string, number>();
  for (const u of users) {
    const label = u.sector?.nameEn ?? "—";
    sectorMap.set(label, (sectorMap.get(label) ?? 0) + 1);
  }
  const bySector = Array.from(sectorMap.entries())
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return (
    <AdminUsersClient
      users={rows}
      byRole={byRole}
      byMonth={byMonth}
      bySector={bySector}
      statusMix={statusMix}
    />
  );
}
