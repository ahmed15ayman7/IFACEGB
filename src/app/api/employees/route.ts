import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";

const createSchema = z.object({
  // User fields
  email: z.string().email(),
  name: z.string().min(2),
  nameAr: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(["employee", "trainer", "sector_manager", "admin"] as const),
  sectorId: z.string().optional(),
  // Employee fields
  employeeCode: z.string().min(2),
  jobTitleEn: z.string().optional(),
  jobTitleAr: z.string().optional(),
  departmentEn: z.string().optional(),
  departmentAr: z.string().optional(),
  contractType: z.enum(["full_time", "part_time", "contract", "intern"]).default("full_time"),
  salaryBase: z.number().min(0).default(0),
  salaryCurrency: z.string().default("EGP"),
  profitSharePct: z.number().min(0).max(100).default(0),
  hireDate: z.string().min(1), // ISO date string
  phone: z.string().optional(),
  nationalId: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;

  // Check for duplicate email or employee code
  const [existingEmail, existingCode] = await Promise.all([
    prisma.user.findUnique({ where: { email: d.email } }),
    prisma.employee.findUnique({ where: { employeeCode: d.employeeCode } }),
  ]);
  if (existingEmail) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  if (existingCode) return NextResponse.json({ error: "Employee code already in use" }, { status: 409 });

  const passwordHash = await bcrypt.hash(d.password, 12);

  const user = await prisma.user.create({
    data: {
      email: d.email,
      name: d.name,
      nameAr: d.nameAr ?? null,
      passwordHash,
      role: d.role as UserRole,
      sectorId: d.sectorId ?? null,
      isActive: true,
      profitSharePct: d.profitSharePct,
    },
  });

  const employee = await prisma.employee.create({
    data: {
      userId: user.id,
      sectorId: d.sectorId ?? null,
      employeeCode: d.employeeCode,
      jobTitleEn: d.jobTitleEn ?? null,
      jobTitleAr: d.jobTitleAr ?? null,
      departmentEn: d.departmentEn ?? null,
      departmentAr: d.departmentAr ?? null,
      contractType: d.contractType,
      salaryBase: d.salaryBase,
      salaryCurrency: d.salaryCurrency,
      profitSharePct: d.profitSharePct,
      hireDate: new Date(d.hireDate),
      phone: d.phone ?? null,
      nationalId: d.nationalId ?? null,
      address: d.address ?? null,
    },
  });

  // Create employee wallet
  await prisma.wallet.create({
    data: {
      ownerId: user.id,
      walletType: "EmployeeWallet",
      balanceCoins: 0,
    },
  }).catch(() => null); // non-blocking

  await logAudit({
    userId: session.user.id,
    action: "employee_create",
    entityType: "Employee",
    entityId: employee.id,
    severity: "info",
    after: { email: d.email, employeeCode: d.employeeCode, role: d.role },
  });

  return NextResponse.json({ success: true, employeeId: employee.id }, { status: 201 });
}
