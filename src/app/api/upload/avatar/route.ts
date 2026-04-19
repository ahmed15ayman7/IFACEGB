import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { logAudit } from "@/lib/audit/audit.service";

// Max 5 MB
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const targetUserId = (formData.get("userId") as string | null) ?? session.user.id;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, or WEBP." }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File too large. Max 5 MB." }, { status: 400 });

  // Only allow admins to upload for other users
  const isSelf = targetUserId === session.user.id;
  const isAdmin = ["super_admin", "admin"].includes(session.user.role);
  if (!isSelf && !isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const buffer = Buffer.from(await file.arrayBuffer());

  const avatarUrl = await uploadToCloudinary(buffer, {
    folder: "iface-global/avatars",
    public_id: `avatar_${targetUserId}`,
    overwrite: true,
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto:good", fetch_format: "auto" },
    ],
  });

  // Persist to database
  await prisma.user.update({
    where: { id: targetUserId },
    data: { avatarUrl },
  });

  await logAudit({
    userId: session.user.id,
    action: "avatar_upload",
    entityType: "User",
    entityId: targetUserId,
    severity: "info",
    after: { avatarUrl },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ success: true, avatarUrl });
}
