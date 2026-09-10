import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        industry: true,
        foundedYear: true,
        employeeCount: true,
        website: true,
        location: true,
        description: true,
        logoUrl: true,
        profileCompleted: true,
        createdAt: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ company }, { status: 200 });
  } catch (error) {
    console.error('GET /api/company/profile error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      industry,
      foundedYear,
      employeeCount,
      website,
      location,
      description,
      logoUrl,
      profileCompleted,
    } = body;

    // Build update object — only include fields that are explicitly passed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (industry !== undefined) updateData.industry = industry || null;
    if (foundedYear !== undefined) updateData.foundedYear = foundedYear ? Number(foundedYear) : null;
    if (employeeCount !== undefined) updateData.employeeCount = employeeCount || null;
    if (website !== undefined) updateData.website = website || null;
    if (location !== undefined) updateData.location = location || null;
    if (description !== undefined) updateData.description = description || null;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null;
    if (profileCompleted !== undefined) updateData.profileCompleted = Boolean(profileCompleted);

    const company = await prisma.company.update({
      where: { id: session.companyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        industry: true,
        foundedYear: true,
        employeeCount: true,
        website: true,
        location: true,
        description: true,
        logoUrl: true,
        profileCompleted: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ company }, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/company/profile error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
