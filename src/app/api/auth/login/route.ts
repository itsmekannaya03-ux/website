import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { signToken, isAdminEmail, verifyAdminPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const isAdmin = isAdminEmail(normalizedEmail);

    // If admin, require password
    if (isAdmin) {
      if (!password) {
        return NextResponse.json({ requirePassword: true, message: 'Admin password required' }, { status: 200 });
      }
      if (!verifyAdminPassword(password)) {
        return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
      }
    }

    const role = isAdmin ? 'admin' : 'student';
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      user = await prisma.user.create({ data: { email: normalizedEmail, role } });
    }
    if (user.blocked) {
      return NextResponse.json({ error: 'Your account has been blocked due to suspicious activity.' }, { status: 403 });
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const response = NextResponse.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name, pin: user.pin, branch: user.branch, year: user.year } });
    response.cookies.set('token', token, { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 86400 });
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
