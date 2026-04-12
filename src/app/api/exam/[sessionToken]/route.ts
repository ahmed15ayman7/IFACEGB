import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";

type Props = { params: Promise<{ sessionToken: string }> };

export async function GET(req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionToken } = await params;

  const examSession = await prisma.examSession.findUnique({
    where: { sessionToken },
  });

  if (!examSession || examSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Exam session not found" }, { status: 404 });
  }

  // Generate dynamic question set if not already assigned
  if (!examSession.questionSetJson) {
    const questions = await prisma.examQuestion.findMany({
      where: { isActive: true },
      orderBy: { weight: "desc" },
      take: 30,
    });

    // Shuffle to create unique form per student
    const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, 20);

    await prisma.examSession.update({
      where: { sessionToken },
      data: {
        questionSetJson: shuffled.map((q) => q.id),
        status: "in_progress",
        startedAt: new Date(),
      },
    });

    return NextResponse.json({
      sessionToken,
      durationMinutes: examSession.durationMinutes,
      questions: shuffled.map((q) => ({
        id: q.id,
        questionEn: q.questionEn,
        questionAr: q.questionAr,
        optionsJson: q.optionsJson,
        topic: q.topic,
      })),
    });
  }

  const questionIds = examSession.questionSetJson as string[];
  const questions = await prisma.examQuestion.findMany({
    where: { id: { in: questionIds } },
  });

  return NextResponse.json({
    sessionToken,
    durationMinutes: examSession.durationMinutes,
    questions: questions.map((q) => ({
      id: q.id,
      questionEn: q.questionEn,
      questionAr: q.questionAr,
      optionsJson: q.optionsJson,
      topic: q.topic,
    })),
  });
}
