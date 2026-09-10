import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePlatformAdminSession } from '@/lib/platformAdminAuth';

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdminSession(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const plan = searchParams.get('plan')?.trim().toLowerCase() || 'all';
    const status = searchParams.get('status')?.trim().toLowerCase() || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    // Build Prisma where filter
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (plan !== 'all') {
      where.plan = plan;
    }

    if (status !== 'all') {
      where.status = status;
    }

    const [totalCount, companies] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          status: true,
          industry: true,
          createdAt: true,
          subscription: {
            select: {
              plan: true,
              status: true,
              renewsAt: true,
            },
          },
          _count: {
            select: {
              jobs: true,
              users: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      companies,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error: any) {
    if (error?.message === 'Unauthorized Platform Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Platform Admin Companies Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
