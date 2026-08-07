import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePasswordResetToken } from '@/lib/jwt';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up company and associated user
    const company = await prisma.company.findUnique({
      where: { email: normalizedEmail },
      include: { users: true },
    });

    const genericSuccessResponse = NextResponse.json(
      { message: 'If an account exists with this email, a reset link has been sent.' },
      { status: 200 }
    );

    // If user not found, return generic success message to prevent email enumeration
    if (!company) {
      return genericSuccessResponse;
    }

    // Rate Limiting: Max 1 request per 60 seconds per email
    const NOW = new Date();
    if (company.lastPasswordResetSentAt) {
      const timeDiffSeconds = (NOW.getTime() - company.lastPasswordResetSentAt.getTime()) / 1000;
      if (timeDiffSeconds < 60) {
        const remainingSeconds = Math.ceil(60 - timeDiffSeconds);
        return NextResponse.json(
          { error: `Please wait ${remainingSeconds} seconds before requesting another password reset email.` },
          { status: 429 }
        );
      }
    }

    const user = company.users[0] || { id: company.id, email: company.email };

    // Generate 1-hour password reset token
    const token = generatePasswordResetToken({ id: user.id, email: company.email });

    // Send reset email
    const emailSent = await sendPasswordResetEmail(company.email, token);

    if (!emailSent) {
      return NextResponse.json(
        { error: "Password reset email could not be sent. Please check your Gmail SMTP configuration and try again." },
        { status: 502 }
      );
    }

    // Update lastPasswordResetSentAt timestamp
    await prisma.company.update({
      where: { id: company.id },
      data: { lastPasswordResetSentAt: NOW },
    });

    await prisma.user.updateMany({
      where: { email: normalizedEmail },
      data: { lastPasswordResetSentAt: NOW },
    });

    return NextResponse.json(
      {
        message: 'If an account exists with this email, a reset link has been sent.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
