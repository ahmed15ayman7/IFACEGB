import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit.service";
import { z } from "zod";

const createSchema = z.object({
  subject: z.string().min(3).max(200),
  description: z.string().min(10),
  priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  isHierarchyBypass: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const isAdmin = ["super_admin", "admin"].includes(session.user.role);

  const tickets = await prisma.supportTicket.findMany({
    where: {
      ...(isAdmin ? {} : { requesterId: session.user.id }),
      ...(status ? { status } : {}),
    },
    include: {
      requester: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      requesterId: session.user.id,
      subject: parsed.data.subject,
      description: parsed.data.description,
      priority: parsed.data.priority,
      isHierarchyBypass: parsed.data.isHierarchyBypass,
      status: "open",
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "create_support_ticket",
    target: ticket.id,
    meta: { subject: ticket.subject, priority: ticket.priority },
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
