export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const answers = await prisma.answer.findMany({ where: { userId: session.userId } });
    const totalQns = await prisma.question.count();
    const totalScore = answers.filter((a: { isCorrect: boolean }) => a.isCorrect).length;
    const passed = totalScore >= Math.ceil(totalQns * 0.4); // 40% pass mark

    const result = await prisma.result.upsert({
      where: { userId: session.userId },
      update: { totalScore, totalQns, passed },
      create: { userId: session.userId, totalScore, totalQns, passed },
    });

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
