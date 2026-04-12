import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ directive: null });

  // Find active directive not yet acknowledged by this user
  const directive = await prisma.eDirective.findFirst({
    where: {
      status: "active",
      acks: { none: { userId: session.user.id } },
      OR: [
        { targetType: "all" },
        { targetType: "sector", sectorId: session.user.sectorId ?? undefined },
        { targetType: "employee" },
        { targetType: "agent", author: { role: "super_admin" } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ directive });
}
