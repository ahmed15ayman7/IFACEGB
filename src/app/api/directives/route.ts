import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { titleEn, titleAr, bodyEn, bodyAr, priority, targetType, sectorId, authorId } =
    await req.json();

  if (!titleEn?.trim() || !bodyEn?.trim()) {
    return NextResponse.json({ error: "Title and body required" }, { status: 400 });
  }

  const directive = await prisma.eDirective.create({
    data: {
      authorId,
      sectorId: sectorId ?? null,
      titleEn,
      titleAr: titleAr ?? null,
      bodyEn,
      bodyAr: bodyAr ?? null,
      priority: priority ?? "normal",
      targetType: targetType ?? "all",
      status: "active",
    },
  });

  await logAudit({
    userId: authorId,
    action: "directive_broadcast",
    entityType: "EDirective",
    entityId: directive.id,
    severity: priority === "urgent" ? "warning" : "info",
    after: { titleEn, targetType },
  });

  return NextResponse.json({ success: true, directiveId: directive.id });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "active";

  const directives = await prisma.eDirective.findMany({
    where: { status: status as "active" | "expired" | "cancelled" },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      _count: { select: { acks: true } },
    },
    take: 50,
  });

  return NextResponse.json(directives);
}
