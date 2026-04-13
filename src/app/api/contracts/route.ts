import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { createHash } from "crypto";
import { z } from "zod";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employee = await prisma.employee.findUnique({ where: { userId: session.user.id } });
  if (!employee) return NextResponse.json({ error: "Employee record not found" }, { status: 404 });

  const contracts = await prisma.electronicContract.findMany({
    where: { employeeId: employee.id },
    orderBy: { createdAt: "desc" },
    include: { electronicSignatures: { select: { signedAt: true, ipAddress: true } } },
  });

  return NextResponse.json(contracts);
}

const signSchema = z.object({
  contractId: z.string().min(1),
  ipAddress: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = signSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { contractId, ipAddress } = parsed.data;

  const employee = await prisma.employee.findUnique({ where: { userId: session.user.id } });
  if (!employee) return NextResponse.json({ error: "Employee record not found" }, { status: 404 });

  const contract = await prisma.electronicContract.findUnique({ where: { id: contractId } });
  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  if (contract.employeeId !== employee.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (contract.status === "signed") return NextResponse.json({ error: "Already signed" }, { status: 400 });

  const signedAt = new Date();
  const signatureHash = createHash("sha256")
    .update(`${session.user.id}:${contractId}:${signedAt.toISOString()}`)
    .digest("hex");

  await prisma.$transaction([
    prisma.electronicSignature.create({
      data: {
        contractId,
        signerId: session.user.id,
        signatureB64: signatureHash,
        ipAddress: ipAddress ?? null,
        signedAt,
      },
    }),
    prisma.electronicContract.update({
      where: { id: contractId },
      data: {
        status: "signed",
        signedAt,
        signatureHash,
        ipAddress: ipAddress ?? null,
      },
    }),
  ]);

  await logAudit({
    userId: session.user.id,
    action: "contract_sign",
    entityType: "ElectronicContract",
    entityId: contractId,
    severity: "info",
    after: { signedAt: signedAt.toISOString(), signatureHash },
  });

  return NextResponse.json({ success: true, signatureHash });
}
