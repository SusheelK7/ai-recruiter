import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCompanySubscription } from '@/lib/enforcePlanLimit';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = session;
    const { subscription, plan } = await getCompanySubscription(companyId);

    // Parallel metrics query for speed
    const [activeJobsCount, aiScansCount, seatsCount] = await Promise.all([
      prisma.job.count({
        where: { companyId, status: 'active' },
      }),
      prisma.application.count({
        where: {
          job: { companyId },
          matchScore: { not: null },
        },
      }),
      prisma.user.count({
        where: { companyId },
      }),
    ]);

    const calculateUsage = (current: number, limit: number) => {
      const isInf = !Number.isFinite(limit);
      const remaining = isInf ? Infinity : Math.max(0, limit - current);
      const percent = isInf ? 0 : Math.min(100, Math.round((current / limit) * 100));
      return { current, limit, remaining, percent, isUnlimited: isInf };
    };

    const paymentIssue = subscription.status === 'payment_issue';

    return NextResponse.json({
      plan: plan.key,
      planName: plan.name,
      status: subscription.status,
      paymentIssue,
      renewsAt: subscription.renewsAt ? subscription.renewsAt.toISOString() : null,
      hasCustomerPortal: true,
      features: plan.features,
      limits: {
        jobLimit: plan.jobLimit,
        aiScansLimit: plan.aiScansLimit,
        seatsLimit: plan.seatsLimit,
      },
      usage: {
        jobs: calculateUsage(activeJobsCount, plan.jobLimit),
        aiScans: calculateUsage(aiScansCount, plan.aiScansLimit),
        seats: calculateUsage(seatsCount, plan.seatsLimit),
      },
      planDetails: plan,
    });
  } catch (error: any) {
    console.error('[Billing Status Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve billing status.' },
      { status: 500 }
    );
  }
}
