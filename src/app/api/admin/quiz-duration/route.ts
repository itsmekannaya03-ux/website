export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { duration } = await req.json();

    const quizState = await prisma.quizState.upsert({
      where: { id: 'singleton' },
      update: { duration: Number(duration) || 30 },
      create: { id: 'singleton', duration: Number(duration) || 30 },
    });

    return NextResponse.json({ quizState });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
