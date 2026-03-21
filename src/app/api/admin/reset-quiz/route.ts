import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    console.log('Admin triggered FRESH START reset...');

    // Delete dependent student data first
    await prisma.answer.deleteMany({});
    await prisma.result.deleteMany({});
    await prisma.cheatFlag.deleteMany({});

    // Delete only students (Users with role: 'student')
    const { count } = await prisma.user.deleteMany({
      where: { role: 'student' }
    });

    // Reset quiz state to fresh inactive state
    await prisma.quizState.upsert({
      where: { id: 'singleton' },
      update: { 
        isActive: false, 
        resultsPublished: false, 
        startTime: null 
      },
      create: { 
        id: 'singleton', 
        isActive: false, 
        resultsPublished: false 
      },
    });

    console.log(`Fresh Start complete: Removed ${count} students and all result data.`);
    return NextResponse.json({ success: true, count });
  } catch (err) {
    console.error('Reset error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
