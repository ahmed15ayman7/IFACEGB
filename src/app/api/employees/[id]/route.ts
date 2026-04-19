import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

const updateSchema = z.object({
  // User fields
  name: z.string().min(2).optional(),
  nameAr: z.string().optional().nullable(),
  role: z.enum(["employee", "trainer", "sector_manager", "admin"] as const).optional(),
  sectorId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  // Employee fields
  jobTitleEn: z.string().optional().nullable(),
  jobTitleAr: z.string().optional().nullable(),
  departmentEn: z.string().optional().nullable(),
  departmentAr: z.string().optional().nullable(),
  contractType: z.enum(["full_time", "part_time", "contract", "intern"]).optional(),
  salaryBase: z.number().min(0).optional(),
  salaryCurrency: z.string().optional(),
  profitSharePct: z.number().min(0).max(100).optional(),
  hireDate: z.string().optional(),
  phone: z.string().optional().nullable(),
  nationalId: z.string().optional().nullable(),
  passportNo: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true, name: true, nameAr: true, email: true, role: true,
          sectorId: true, isActive: true, avatarUrl: true,
        },
      },
      sector: { select: { id: true, nameEn: true, nameAr: true, code: true } },
    },
  });

  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(employee);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;

  // Split fields between User and Employee models
  const userUpdate: Record<string, unknown> = {};
  const employeeUpdate: Record<string, unknown> = {};

  if (d.name !== undefined) userUpdate.name = d.name;
  if (d.nameAr !== undefined) userUpdate.nameAr = d.nameAr;
  if (d.role !== undefined) userUpdate.role = d.role as UserRole;
  if (d.sectorId !== undefined) userUpdate.sectorId = d.sectorId;
  if (d.isActive !== undefined) userUpdate.isActive = d.isActive;
  if (d.profitSharePct !== undefined) userUpdate.profitSharePct = d.profitSharePct;

  if (d.jobTitleEn !== undefined) employeeUpdate.jobTitleEn = d.jobTitleEn;
  if (d.jobTitleAr !== undefined) employeeUpdate.jobTitleAr = d.jobTitleAr;
  if (d.departmentEn !== undefined) employeeUpdate.departmentEn = d.departmentEn;
  if (d.departmentAr !== undefined) employeeUpdate.departmentAr = d.departmentAr;
  if (d.contractType !== undefined) employeeUpdate.contractType = d.contractType;
  if (d.salaryBase !== undefined) employeeUpdate.salaryBase = d.salaryBase;
  if (d.salaryCurrency !== undefined) employeeUpdate.salaryCurrency = d.salaryCurrency;
  if (d.profitSharePct !== undefined) employeeUpdate.profitSharePct = d.profitSharePct;
  if (d.hireDate !== undefined) employeeUpdate.hireDate = new Date(d.hireDate);
  if (d.phone !== undefined) employeeUpdate.phone = d.phone;
  if (d.nationalId !== undefined) employeeUpdate.nationalId = d.nationalId;
  if (d.passportNo !== undefined) employeeUpdate.passportNo = d.passportNo;
  if (d.address !== undefined) employeeUpdate.address = d.address;
  if (d.emergencyContact !== undefined) employeeUpdate.emergencyContact = d.emergencyContact;
  if (d.sectorId !== undefined) employeeUpdate.sectorId = d.sectorId;

  const [updatedUser, updatedEmployee] = await Promise.all([
    Object.keys(userUpdate).length > 0
      ? prisma.user.update({ where: { id: employee.userId }, data: userUpdate })
      : Promise.resolve(null),
    Object.keys(employeeUpdate).length > 0
      ? prisma.employee.update({ where: { id }, data: employeeUpdate })
      : Promise.resolve(null),
  ]);

  await logAudit({
    userId: session.user.id,
    action: "employee_update",
    entityType: "Employee",
    entityId: id,
    severity: "info",
    after: { ...userUpdate, ...employeeUpdate },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ success: true, updatedUser, updatedEmployee });
}
