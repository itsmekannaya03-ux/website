import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { pin, name, branch, year } = await req.json();
    if (!pin || !name || !branch || !year) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { pin, name, branch, year },
    });

    return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name, pin: user.pin, branch: user.branch, year: user.year } });
  } catch (error) {
    console.error('Details error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
