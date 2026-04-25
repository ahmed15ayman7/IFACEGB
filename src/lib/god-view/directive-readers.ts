import { prisma } from "@/lib/prisma";
import type { EDirective, Prisma, User } from "@prisma/client";

export type UserRow = Pick<User, "id" | "name" | "email" | "role">;

export async function getDirectiveWithReaders(directiveId: string) {
  return prisma.eDirective.findUnique({
    where: { id: directiveId },
    include: {
      sector: { select: { nameEn: true, nameAr: true } },
      author: { select: { name: true, email: true } },
      acks: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { ackedAt: "desc" },
      },
    },
  });
}

/**
 * "Not yet acknowledged" = expected audience minus acks, using directive targetType.
 * Caps result set to avoid unbounded lists for targetType "all".
 */
export async function getNotAckedUsers(
  directive: EDirective,
  ackUserIds: Set<string>,
  cap = 300,
): Promise<UserRow[]> {
  const notIn: Prisma.StringFilter = { notIn: Array.from(ackUserIds) };

  if (directive.targetType === "all") {
    return prisma.user.findMany({
      where: { isActive: true, isSuspended: false, id: notIn },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { email: "asc" },
      take: cap,
    });
  }
  if (directive.targetType === "sector" && directive.sectorId) {
    return prisma.user.findMany({
      where: { sectorId: directive.sectorId, isActive: true, isSuspended: false, id: notIn },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { email: "asc" },
      take: cap,
    });
  }
  if (directive.targetType === "agent") {
    return prisma.user.findMany({
      where: { role: "agent", isActive: true, isSuspended: false, id: notIn },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { email: "asc" },
      take: cap,
    });
  }
  if (directive.targetType === "employee" && directive.targetIds && Array.isArray(directive.targetIds)) {
    const ids = (directive.targetIds as unknown[]).filter(
      (x): x is string => typeof x === "string" && !ackUserIds.has(x),
    );
    if (ids.length === 0) return [];
    return prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { email: "asc" },
      take: cap,
    });
  }
  return [];
}
