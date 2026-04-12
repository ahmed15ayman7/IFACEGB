import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";

type Props = { params: Promise<{ sessionToken: string }> };

export async function POST(req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionToken } = await params;
  const { answers } = await req.json();

  const examSession = await prisma.examSession.findUnique({
    where: { sessionToken },
  });

  if (!examSession || examSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Exam session not found" }, { status: 404 });
  }

  // Grade answers
  const questionIds = Object.keys(answers);
  const questions = await prisma.examQuestion.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, correctAnswer: true, weight: true },
  });

  let totalWeight = 0;
  let correctWeight = 0;
  const examAnswers = [];

  for (const q of questions) {
    const selected = answers[q.id];
    const isCorrect = selected === q.correctAnswer;
    totalWeight += q.weight;
    if (isCorrect) correctWeight += q.weight;

    examAnswers.push({
      examSessionId: examSession.id,
      questionId: q.id,
      selectedAnswer: selected ?? "",
      isCorrect,
    });
  }

  const score = totalWeight > 0 ? (correctWeight / totalWeight) * 100 : 0;

  await prisma.$transaction([
    prisma.examAnswer.createMany({ data: examAnswers }),
    prisma.examSession.update({
      where: { id: examSession.id },
      data: {
        status: "completed",
        score,
        completedAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({ success: true, score: Math.round(score) });
}
