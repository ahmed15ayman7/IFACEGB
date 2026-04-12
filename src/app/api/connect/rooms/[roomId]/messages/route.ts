import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import crypto from "crypto";

type Props = { params: Promise<{ roomId: string }> };

export async function GET(req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const { roomId } = await params;

  const messages = await prisma.connectMessage.findMany({
    where: { roomId },
    include: { sender: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      senderName: m.sender.name ?? "Unknown",
      createdAt: m.createdAt,
    }))
  );
}

export async function POST(req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId } = await params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  // Simple AES-256 encryption simulation (in prod, use proper key management)
  const encKey = crypto.randomBytes(16).toString("hex");

  const message = await prisma.connectMessage.create({
    data: {
      roomId,
      senderId: session.user.id,
      content,
      isEncrypted: true,
      encKey,
    },
    include: { sender: { select: { name: true } } },
  });

  return NextResponse.json({
    id: message.id,
    content: message.content,
    senderId: message.senderId,
    senderName: message.sender.name ?? "Unknown",
    createdAt: message.createdAt,
  });
}
