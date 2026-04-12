import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  applicantName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  countryCode: z.string().min(2),
  businessName: z.string().optional(),
  motivation: z.string().min(50),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const application = await prisma.agencyApplication.create({
    data: {
      applicantName: parsed.data.applicantName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      countryCode: parsed.data.countryCode,
      businessName: parsed.data.businessName,
      motivation: parsed.data.motivation,
      status: "pending",
    },
  });

  return NextResponse.json({ success: true, id: application.id });
}
