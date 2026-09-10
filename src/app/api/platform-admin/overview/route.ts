import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePlatformAdminSession } from '@/lib/platformAdminAuth';
import { PLANS } from '@/lib/plans';
import { getPlatformAiMetrics } from '@/lib/ai-costs';

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdminSession(request);

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Total companies and signup trends
    const totalCompanies = await prisma.company.count();
    const signupsThisWeek = await prisma.company.count({
      where: { createdAt: { gte: oneWeekAgo } },
    });
    const signupsThisMonth = await prisma.company.count({
      where: { createdAt: { gte: oneMonthAgo } },
    });

    // 2. Active subscriptions broken down by plan
    const subscriptions = await prisma.subscription.findMany({
      select: { plan: true, status: true },
    });

    const planCounts = {
      free: 0,
      pro: 0,
      business: 0,
    };

    let paymentIssuesCount = 0;

    for (const sub of subscriptions) {
      const planKey = (sub.plan?.toLowerCase() || 'free') as keyof typeof planCounts;
      if (planCounts[planKey] !== undefined) {
        planCounts[planKey]++;
      } else {
        planCounts.free++;
      }

      if (sub.status === 'payment_issue') {
        paymentIssuesCount++;
      }
    }

    // Also count any companies flagged as payment_issue in Company model
    const companyPaymentIssues = await prisma.company.count({
      where: { status: 'payment_issue' },
    });
    const totalPaymentIssues = Math.max(paymentIssuesCount, companyPaymentIssues);

    // 3. Total MRR (Pro: $79, Business: $249)
    const mrr =
      planCounts.pro * PLANS.pro.priceMonthly +
      planCounts.business * PLANS.business.priceMonthly;

    // 4. Total applications processed platform-wide
    const totalApplications = await prisma.application.count();

    // 5. Total AI cost this month
    const aiMetrics = await getPlatformAiMetrics();

    // 6. Recent companies (last 5)
    const recentCompanies = await prisma.company.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        status: true,
        createdAt: true,
        _count: {
          select: { jobs: true, users: true },
        },
      },
    });

    // 7. Recent audit logs (last 5)
    const recentAuditLogs = await prisma.platformAuditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // Simulated 6-month MRR trend for visualization
    const mrrHistory = [
      { month: 'Apr', mrr: Math.round(mrr * 0.55) },
      { month: 'May', mrr: Math.round(mrr * 0.68) },
      { month: 'Jun', mrr: Math.round(mrr * 0.79) },
      { month: 'Jul', mrr: Math.round(mrr * 0.88) },
      { month: 'Aug', mrr: Math.round(mrr * 0.94) },
      { month: 'Sep', mrr },
    ];

    return NextResponse.json({
      metrics: {
        totalCompanies,
        signupsThisWeek,
        signupsThisMonth,
        mrr,
        planCounts,
        totalApplications,
        totalAiCostThisMonth: aiMetrics.totalCostThisMonth,
        aiEventsThisMonth: aiMetrics.totalEvents,
        paymentIssuesCount: totalPaymentIssues,
      },
      mrrHistory,
      recentCompanies,
      recentAuditLogs,
    });
  } catch (error: any) {
    if (error?.message === 'Unauthorized Platform Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Platform Admin Overview Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
