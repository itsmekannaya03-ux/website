import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { isActive, duration } = await req.json();

    const quizState = await prisma.quizState.upsert({
      where: { id: 'singleton' },
      update: {
        isActive,
        duration: duration || 30,
        startTime: isActive ? new Date() : null,
      },
      create: {
        id: 'singleton',
        isActive,
        duration: duration || 30,
        startTime: isActive ? new Date() : null,
      },
    });

    return NextResponse.json({ quizState });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
