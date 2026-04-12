import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ipAddress = req.headers.get("x-forwarded-for") ?? undefined;

  await prisma.eDirectiveAcknowledgment.upsert({
    where: { directiveId_userId: { directiveId: id, userId: session.user.id } },
    update: {},
    create: {
      directiveId: id,
      userId: session.user.id,
      ipAddress,
    },
  });

  return NextResponse.json({ success: true });
}
