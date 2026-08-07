import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Normalize email to lowercase
    const normalizedEmail = email.trim().toLowerCase();

    // Find the company by email
    const company = await prisma.company.findUnique({
      where: { email: normalizedEmail },
    });

    // If no company found with this email
    if (!company) {
      return NextResponse.json(
        { error: "We don't have any account with this email." },
        { status: 404 }
      );
    }

    // Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, company.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password. Please try again.' },
        { status: 401 }
      );
    }

    // Check if email is verified before logging in
    if (!company.emailVerified) {
      return NextResponse.json(
        {
          error: 'Please verify your email before logging in.',
          emailVerified: false,
          email: company.email,
        },
        { status: 403 }
      );
    }

    // Login successful — return company data (excluding sensitive fields)
    return NextResponse.json(
      {
        message: 'Login successful!',
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          plan: company.plan,
          emailVerified: company.emailVerified,
          createdAt: company.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
