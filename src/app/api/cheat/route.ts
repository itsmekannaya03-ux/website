import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { reason } = await req.json();

    await prisma.cheatFlag.create({
      data: { userId: session.userId, reason },
    });

    await prisma.user.update({
      where: { id: session.userId },
      data: { blocked: true },
    });

    return NextResponse.json({ blocked: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
