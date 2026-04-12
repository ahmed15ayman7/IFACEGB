import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const rooms = await prisma.connectRoom.findMany({
    where: {
      participants: { some: { userId: session.user.id } },
    },
    include: { _count: { select: { messages: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(rooms);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type, participantIds } = await req.json();

  const room = await prisma.connectRoom.create({
    data: {
      name,
      type: type ?? "direct",
      participants: {
        create: [
          { userId: session.user.id },
          ...(participantIds ?? []).map((uid: string) => ({ userId: uid })),
        ],
      },
    },
  });

  return NextResponse.json(room);
}
