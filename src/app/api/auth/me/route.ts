import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.blocked) return NextResponse.json({ error: 'Account blocked' }, { status: 403 });

    const resultStatus = await prisma.result.findUnique({ where: { userId: user.id } });

    return NextResponse.json({ 
      user: { 
        id: user.id, email: user.email, role: user.role, name: user.name, pin: user.pin, branch: user.branch, year: user.year, blocked: user.blocked,
        hasSubmitted: !!resultStatus 
      } 
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
