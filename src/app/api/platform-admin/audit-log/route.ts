import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePlatformAdminSession } from '@/lib/platformAdminAuth';

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdminSession(request);

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId')?.trim();
    const action = searchParams.get('action')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (companyId) where.targetCompanyId = companyId;
    if (action && action !== 'all') where.action = action;

    const [totalCount, logs] = await Promise.all([
      prisma.platformAuditLog.count({ where }),
      prisma.platformAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Fetch company names for the target companies in these logs
    const companyIds = Array.from(new Set(logs.map((l) => l.targetCompanyId)));
    const companies = await prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, name: true, email: true },
    });
    const companyMap = new Map(companies.map((c) => [c.id, c]));

    const enrichedLogs = logs.map((log) => ({
      ...log,
      company: companyMap.get(log.targetCompanyId) || {
        id: log.targetCompanyId,
        name: 'Deleted Company',
        email: '',
      },
    }));

    return NextResponse.json({
      logs: enrichedLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    if (error?.message === 'Unauthorized Platform Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Platform Admin Audit Log Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
