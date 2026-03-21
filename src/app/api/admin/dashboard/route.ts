export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const totalStudents = await prisma.user.count({ where: { role: 'student' } });
    const results = await prisma.result.findMany({ include: { user: true } });
    const passed = results.filter((r: { passed: boolean }) => r.passed).length;
    const failed = results.filter((r: { passed: boolean }) => !r.passed).length;
    const pending = totalStudents - results.length;
    const cheated = await prisma.cheatFlag.findMany({ select: { userId: true }, distinct: ['userId'] });
    const toppers = results.sort((a: { totalScore: number }, b: { totalScore: number }) => b.totalScore - a.totalScore).slice(0, 5);
    const cheatFlags = await prisma.cheatFlag.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
    const blockedUsers = await prisma.user.findMany({ where: { blocked: true } });
    const quizState = await prisma.quizState.findUnique({ where: { id: 'singleton' } });
    const questions = await prisma.question.findMany({ orderBy: { order: 'asc' } });

    return NextResponse.json({
      stats: { totalStudents, passed, failed, pending, cheatedCount: cheated.length },
      toppers: toppers.map((t: { user: { name: string | null; email: string }; totalScore: number; totalQns: number }) => ({ name: t.user.name, email: t.user.email, score: t.totalScore, total: t.totalQns })),
      cheatFlags: cheatFlags.map((c: { id: string; user: { name: string | null; email: string }; reason: string; createdAt: Date }) => ({ id: c.id, name: c.user.name, email: c.user.email, reason: c.reason, time: c.createdAt })),
      blockedUsers: blockedUsers.map((u: { id: string; name: string | null; email: string }) => ({ id: u.id, name: u.name, email: u.email })),
      quizState,
      questions,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
