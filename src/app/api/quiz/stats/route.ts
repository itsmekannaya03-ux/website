import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const results = await prisma.result.findMany({ include: { user: true } });
    const totalStudents = await prisma.user.count({ where: { role: 'student' } });
    const passed = results.filter((r: { passed: boolean }) => r.passed).length;
    const failed = results.filter((r: { passed: boolean }) => !r.passed).length;
    const pending = totalStudents - results.length;
    const toppers = results
      .sort((a: { totalScore: number }, b: { totalScore: number }) => b.totalScore - a.totalScore)
      .slice(0, 5)
      .map((t: { user: { name: string | null }; totalScore: number; totalQns: number }) => ({
        name: t.user.name || 'Anonymous',
        score: t.totalScore,
        total: t.totalQns,
      }));

    return NextResponse.json({ passed, failed, pending, toppers });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
