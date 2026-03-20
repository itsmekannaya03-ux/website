import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { text, optionA, optionB, optionC, optionD, correctOption } = await req.json();
    if (!text || !optionA || !optionB || !optionC || !optionD || !correctOption) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    const count = await prisma.question.count();
    const question = await prisma.question.create({
      data: { text, optionA, optionB, optionC, optionD, correctOption, order: count + 1 },
    });

    return NextResponse.json({ question });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, text, optionA, optionB, optionC, optionD, correctOption } = await req.json();
    const question = await prisma.question.update({
      where: { id },
      data: { text, optionA, optionB, optionC, optionD, correctOption },
    });

    return NextResponse.json({ question });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await req.json();
    await prisma.answer.deleteMany({ where: { questionId: id } });
    await prisma.question.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
