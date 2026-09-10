import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generatePlatformAdminToken } from '@/lib/jwt';
import { PLATFORM_ADMIN_COOKIE_NAME } from '@/lib/platformAdminAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const admin = await prisma.platformAdmin.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid platform admin credentials.' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid platform admin credentials.' },
        { status: 401 }
      );
    }

    const token = generatePlatformAdminToken({
      id: admin.id,
      email: admin.email,
    });

    const response = NextResponse.json(
      {
        message: 'Platform admin authenticated successfully.',
        admin: {
          id: admin.id,
          email: admin.email,
        },
      },
      { status: 200 }
    );

    response.cookies.set(PLATFORM_ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('[Platform Admin Login Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error during platform admin login.' },
      { status: 500 }
    );
  }
}
