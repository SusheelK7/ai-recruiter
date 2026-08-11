import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateVerificationToken } from '@/lib/jwt';
import { sendVerificationEmail, getVerificationUrl } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, email, password } = body;

    // Validate required fields
    if (!companyName || !email || !password) {
      return NextResponse.json(
        { error: 'Company name, email, and password are required.' },
        { status: 400 }
      );
    }

    // Normalize email to lowercase
    const normalizedEmail = email.trim().toLowerCase();

    // Check if a company already exists with this email
    const existingCompany = await prisma.company.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: 'An account already exists with this email.' },
        { status: 409 }
      );
    }

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create the company and initial admin user record
    const company = await prisma.company.create({
      data: {
        name: companyName.trim(),
        email: normalizedEmail,
        passwordHash,
        emailVerified: false,
        lastVerificationSentAt: new Date(),
        users: {
          create: {
            email: normalizedEmail,
            passwordHash,
            role: 'admin',
            emailVerified: false,
            lastVerificationSentAt: new Date(),
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = company.users[0] || { id: company.id, email: company.email };

    // Generate 24-hour verification token
    const token = generateVerificationToken({ id: user.id, email: user.email });

    // Send verification email
    await sendVerificationEmail(user.email, token);

    const verificationUrl = getVerificationUrl(token);

    return NextResponse.json(
      {
        message: 'Account created successfully! Please check your email to verify your account before logging in.',
        verificationUrl,
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          plan: company.plan,
          emailVerified: false,
          createdAt: company.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Registration error:', error);

    // Handle Prisma unique constraint violation (race condition fallback)
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'An account already exists with this email.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
