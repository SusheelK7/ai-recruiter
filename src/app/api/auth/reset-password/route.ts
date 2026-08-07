import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPasswordResetToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

function validatePasswordComplexity(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character.';
  return null;
}

// GET method to validate token status before rendering frontend form
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Reset token is required.' }, { status: 400 });
    }

    const payload = verifyPasswordResetToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired password reset token.' }, { status: 400 });
    }

    const normalizedEmail = payload.email.toLowerCase().trim();
    const company = await prisma.company.findUnique({ where: { email: normalizedEmail } });

    if (!company) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    // REQUIREMENT 4: Email verification required before password reset
    if (!company.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email first before resetting your password.' },
        { status: 400 }
      );
    }

    // Single-use check
    if (company.passwordResetAt && payload.iat) {
      const resetTimestampSec = Math.floor(company.passwordResetAt.getTime() / 1000);
      if (payload.iat <= resetTimestampSec) {
        return NextResponse.json(
          { error: 'This password reset token has already been used. Please request a new one.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ valid: true, email: company.email }, { status: 200 });
  } catch (error) {
    console.error('Reset token validation error:', error);
    return NextResponse.json({ error: 'Failed to validate reset token.' }, { status: 500 });
  }
}

// POST method to set new password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and new password are required.' },
        { status: 400 }
      );
    }

    // Verify token (signature & expiry)
    const payload = verifyPasswordResetToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset token.' },
        { status: 400 }
      );
    }

    const normalizedEmail = payload.email.toLowerCase().trim();

    // Look up account
    const company = await prisma.company.findUnique({
      where: { email: normalizedEmail },
    });

    if (!company) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    // REQUIREMENT 4: Confirm emailVerified === true
    if (!company.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email first before resetting your password.' },
        { status: 400 }
      );
    }

    // Single-use token invalidation check
    if (company.passwordResetAt && payload.iat) {
      const resetTimestampSec = Math.floor(company.passwordResetAt.getTime() / 1000);
      if (payload.iat <= resetTimestampSec) {
        return NextResponse.json(
          { error: 'This password reset token has already been used. Please request a new one.' },
          { status: 400 }
        );
      }
    }

    // Password validation rules
    const passwordError = validatePasswordComplexity(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const NOW = new Date();

    // Update Company & User passwordHash and passwordResetAt
    await prisma.company.update({
      where: { id: company.id },
      data: {
        passwordHash,
        passwordResetAt: NOW,
      },
    });

    await prisma.user.updateMany({
      where: {
        OR: [{ companyId: company.id }, { email: normalizedEmail }],
      },
      data: {
        passwordHash,
        passwordResetAt: NOW,
      },
    });

    return NextResponse.json(
      { message: 'Password has been reset successfully! You can now log in with your new password.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while resetting password. Please try again.' },
      { status: 500 }
    );
  }
}
