import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateVerificationToken } from '@/lib/jwt';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up company and associated user
    const company = await prisma.company.findUnique({
      where: { email: normalizedEmail },
      include: { users: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'No account found with this email address.' },
        { status: 404 }
      );
    }

    if (company.emailVerified) {
      return NextResponse.json(
        { message: 'This email is already verified. You can log in.' },
        { status: 200 }
      );
    }

    // Rate Limiting: Max 1 request per 60 seconds
    const NOW = new Date();
    if (company.lastVerificationSentAt) {
      const timeDiffSeconds = (NOW.getTime() - company.lastVerificationSentAt.getTime()) / 1000;
      if (timeDiffSeconds < 60) {
        const remainingSeconds = Math.ceil(60 - timeDiffSeconds);
        return NextResponse.json(
          { error: `Please wait ${remainingSeconds} seconds before requesting another verification email.` },
          { status: 429 }
        );
      }
    }

    const user = company.users[0] || { id: company.id, email: company.email };

    // Generate a fresh 24-hour verification token
    const token = generateVerificationToken({ id: user.id, email: company.email });

    // Send email
    const emailSent = await sendVerificationEmail(company.email, token);

    if (!emailSent) {
      return NextResponse.json(
        { error: "Verification email could not be sent. Please check your Gmail SMTP configuration and try again." },
        { status: 502 }
      );
    }

    // Update lastVerificationSentAt timestamp
    await prisma.company.update({
      where: { id: company.id },
      data: { lastVerificationSentAt: NOW },
    });

    if (user.id) {
      await prisma.user.updateMany({
        where: { email: normalizedEmail },
        data: { lastVerificationSentAt: NOW },
      });
    }

    return NextResponse.json(
      {
        message: 'Verification email has been sent! Please check your inbox.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verification email error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
