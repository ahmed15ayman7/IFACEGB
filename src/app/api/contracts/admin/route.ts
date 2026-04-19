import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";

const TEMPLATE_TYPES = [
  "employment_contract",
  "non_disclosure",
  "offer_letter",
  "salary_amendment",
  "termination",
  "other",
] as const;

const createSchema = z.object({
  employeeId: z.string().min(1),
  templateType: z.enum(TEMPLATE_TYPES).default("employment_contract"),
  content: z.string().min(1),
  status: z.enum(["draft", "pending", "signed", "expired"]).default("pending"),
});

/** GET /api/contracts/admin?employeeId=xxx – list contracts for a specific employee */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  if (!employeeId) return NextResponse.json({ error: "employeeId is required" }, { status: 400 });

  const contracts = await prisma.electronicContract.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
    include: {
      employee: {
        select: { user: { select: { name: true, nameAr: true } } },
      },
    },
  });

  return NextResponse.json(
    contracts.map((c) => ({
      ...c,
      signedAt: c.signedAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
    }))
  );
}

/** POST /api/contracts/admin – create a new contract for an employee */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;

  const employee = await prisma.employee.findUnique({ where: { id: d.employeeId }, select: { id: true } });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const contract = await prisma.electronicContract.create({
    data: {
      employeeId: d.employeeId,
      templateType: d.templateType,
      content: d.content,
      status: d.status,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "contract_create",
    entityType: "ElectronicContract",
    entityId: contract.id,
    severity: "info",
    after: { employeeId: d.employeeId, templateType: d.templateType, status: d.status },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ success: true, id: contract.id }, { status: 201 });
}
