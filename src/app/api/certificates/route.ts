import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issueCertificateOnChain } from "@/lib/blockchain/certificate.service";
import { auth } from "@/lib/auth/auth.config";
import { z } from "zod";
import crypto from "crypto";

const createSchema = z.object({
  holderId: z.string(),
  sectorId: z.string().optional(),
  programEn: z.string().min(2),
  programAr: z.string().optional(),
  grade: z.string().optional(),
  score: z.number().optional(),
  expiryDate: z.string().optional(),
  prerequisitesMet: z.object({
    proctoring: z.boolean(),
    directive: z.boolean(),
    skillMatrix: z.boolean(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["super_admin", "admin", "sector_manager"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const certNo = generateCertNo();

    const cert = await prisma.certificate.create({
      data: {
        holderId: parsed.data.holderId,
        issuerId: session.user.id,
        sectorId: parsed.data.sectorId,
        programEn: parsed.data.programEn,
        programAr: parsed.data.programAr,
        grade: parsed.data.grade,
        score: parsed.data.score,
        expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null,
        certificateNo: certNo,
        status: "draft",
        prerequisitesMet: parsed.data.prerequisitesMet,
      },
    });

    return NextResponse.json({ success: true, certificate: cert });
  }

  if (action === "issue") {
    const { certificateId } = body;
    if (!certificateId) return NextResponse.json({ error: "certificateId required" }, { status: 400 });

    try {
      const cert = await issueCertificateOnChain(certificateId, session.user.id);
      return NextResponse.json({ success: true, certificate: cert });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to issue certificate";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const holderId = searchParams.get("holderId") ?? session.user.id;

  const certs = await prisma.certificate.findMany({
    where: { holderId },
    orderBy: { issueDate: "desc" },
    take: 50,
  });

  return NextResponse.json(certs);
}

function generateCertNo(): string {
  return `IFACE-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}
