import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyVerificationToken } from '@/lib/jwt';

async function handleVerification(token: string | null) {
  if (!token) {
    return NextResponse.json(
      { error: 'Verification token is required.' },
      { status: 400 }
    );
  }

  const payload = verifyVerificationToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired verification token. Please request a new one.' },
      { status: 400 }
    );
  }

  const { userId, email } = payload;
  const normalizedEmail = email.toLowerCase().trim();

  // Look up user/company
  const company = await prisma.company.findFirst({
    where: {
      OR: [{ id: userId }, { email: normalizedEmail }],
    },
  });

  if (!company) {
    return NextResponse.json(
      { error: 'Account not found.' },
      { status: 404 }
    );
  }

  // Set emailVerified = true on both Company and User records
  await prisma.company.update({
    where: { id: company.id },
    data: { emailVerified: true },
  });

  await prisma.user.updateMany({
    where: {
      OR: [{ companyId: company.id }, { email: normalizedEmail }],
    },
    data: { emailVerified: true },
  });

  return NextResponse.json(
    {
      message: 'Email verified successfully! You can now log in.',
      emailVerified: true,
    },
    { status: 200 }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    return await handleVerification(token);
  } catch (error) {
    console.error('Verify email GET error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while verifying email.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body.token;
    return await handleVerification(token);
  } catch (error) {
    console.error('Verify email POST error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while verifying email.' },
      { status: 500 }
    );
  }
}
