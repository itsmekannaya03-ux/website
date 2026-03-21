export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.blocked) return NextResponse.json({ error: 'Blocked' }, { status: 403 });

    const questions = await prisma.question.findMany({ orderBy: { order: 'asc' } });
    const answers = await prisma.answer.findMany({ where: { userId: session.userId } });
    const quizState = await prisma.quizState.findUnique({ where: { id: 'singleton' } });

    return NextResponse.json({ questions, answers, quizState });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.blocked) return NextResponse.json({ error: 'Blocked' }, { status: 403 });

    const { questionId, selected } = await req.json();
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    const isCorrect = selected === question.correctOption;
    const answer = await prisma.answer.upsert({
      where: { userId_questionId: { userId: session.userId, questionId } },
      update: { selected, isCorrect },
      create: { userId: session.userId, questionId, selected, isCorrect },
    });

    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
