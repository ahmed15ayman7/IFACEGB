import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";

const checkInSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  snapshotNote: z.string().optional(),
});

const checkOutSchema = z.object({
  attendanceId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { latitude, longitude, snapshotNote } = parsed.data;

  const employee = await prisma.employee.findUnique({ where: { userId: session.user.id } });
  if (!employee) return NextResponse.json({ error: "Employee record not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Simple geofence radius check (placeholder — 5km radius from office)
  const OFFICE_LAT = 30.0444; // Cairo defaults; override via env
  const OFFICE_LNG = 31.2357;
  const R = 6371;
  const dLat = ((latitude - OFFICE_LAT) * Math.PI) / 180;
  const dLng = ((longitude - OFFICE_LNG) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((OFFICE_LAT * Math.PI) / 180) * Math.cos((latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const isGeofenced = distKm <= 5;

  // Work start time: 9:00 AM
  const workStart = new Date(today);
  workStart.setHours(9, 0, 0, 0);
  const now = new Date();
  const lateMinutes = Math.max(0, Math.round((now.getTime() - workStart.getTime()) / 60000));

  const attendance = await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
    create: {
      employeeId: employee.id,
      date: today,
      checkIn: now,
      status: "present",
      locationLat: latitude,
      locationLng: longitude,
      lateMinutes,
      isGeofenced,
      notes: snapshotNote ?? null,
    },
    update: {
      checkIn: now,
      locationLat: latitude,
      locationLng: longitude,
      isGeofenced,
      lateMinutes,
      notes: snapshotNote ?? null,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "attendance_checkin",
    entityType: "Attendance",
    entityId: attendance.id,
    severity: "info",
    after: { latitude, longitude, isGeofenced, lateMinutes },
  });

  return NextResponse.json({ success: true, attendance });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = checkOutSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { attendanceId } = parsed.data;

  const employee = await prisma.employee.findUnique({ where: { userId: session.user.id } });
  if (!employee) return NextResponse.json({ error: "Employee record not found" }, { status: 404 });

  const attendance = await prisma.attendance.findUnique({ where: { id: attendanceId } });
  if (!attendance) return NextResponse.json({ error: "Attendance not found" }, { status: 404 });
  if (attendance.employeeId !== employee.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: { checkOut: new Date() },
  });

  await logAudit({
    userId: session.user.id,
    action: "attendance_checkout",
    entityType: "Attendance",
    entityId: attendanceId,
    severity: "info",
    after: { checkOut: updated.checkOut },
  });

  return NextResponse.json({ success: true, attendance: updated });
}
