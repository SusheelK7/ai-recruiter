import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePlatformAdminSession } from '@/lib/platformAdminAuth';
import { PLANS } from '@/lib/plans';

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdminSession(request);

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 1. All subscriptions
    const subscriptions = await prisma.subscription.findMany({
      include: {
        company: {
          select: { id: true, name: true, email: true, status: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const tierBreakdown = {
      free: { count: 0, price: 0, mrr: 0 },
      pro: { count: 0, price: PLANS.pro.priceMonthly, mrr: 0 },
      business: { count: 0, price: PLANS.business.priceMonthly, mrr: 0 },
    };

    const upcomingRenewals: any[] = [];
    const paymentIssues: any[] = [];

    for (const sub of subscriptions) {
      const p = (sub.plan?.toLowerCase() || 'free') as keyof typeof tierBreakdown;
      if (tierBreakdown[p]) {
        tierBreakdown[p].count++;
        tierBreakdown[p].mrr += tierBreakdown[p].price;
      }

      // Check payment issue
      if (sub.status === 'payment_issue' || sub.company?.status === 'payment_issue') {
        paymentIssues.push({
          companyId: sub.companyId,
          companyName: sub.company?.name || 'Unknown',
          companyEmail: sub.company?.email || 'Unknown',
          plan: sub.plan,
          stripeCustomerId: sub.stripeCustomerId,
          updatedAt: sub.updatedAt,
        });
      }

      // Check upcoming renewals in next 30 days
      if (sub.renewsAt && sub.renewsAt >= now && sub.renewsAt <= thirtyDaysFromNow) {
        upcomingRenewals.push({
          companyId: sub.companyId,
          companyName: sub.company?.name || 'Unknown',
          plan: sub.plan,
          amount: sub.plan === 'business' ? 249 : 79,
          renewsAt: sub.renewsAt,
          stripeCustomerId: sub.stripeCustomerId,
        });
      }
    }

    const totalMrr = tierBreakdown.pro.mrr + tierBreakdown.business.mrr;

    // Recent plan changes from PlatformAuditLog
    const recentPlanChanges = await prisma.platformAuditLog.findMany({
      where: { action: 'manual_plan_change' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      totalMrr,
      tierBreakdown,
      upcomingRenewals: upcomingRenewals.sort(
        (a, b) => new Date(a.renewsAt).getTime() - new Date(b.renewsAt).getTime()
      ),
      paymentIssues,
      recentPlanChanges,
    });
  } catch (error: any) {
    if (error?.message === 'Unauthorized Platform Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Platform Admin Billing Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
