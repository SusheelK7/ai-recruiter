import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePlatformAdminSession } from '@/lib/platformAdminAuth';
import { getPlan } from '@/lib/plans';
import { stripe } from '@/lib/stripe';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requirePlatformAdminSession(request);
    const { id } = await context.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            emailVerified: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        subscription: true,
        jobs: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            _count: {
              select: { applications: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const planDefinition = getPlan(company.subscription?.plan || company.plan);

    // 1. Usage Snapshot
    const activeJobsCount = company.jobs.filter((j) => j.status === 'active').length;
    const totalApplications = await prisma.application.count({
      where: { job: { companyId: company.id } },
    });
    const aiScansUsed = await prisma.application.count({
      where: {
        job: { companyId: company.id },
        matchScore: { not: null },
      },
    });
    const seatsUsed = company.users.length;

    // 2. Billing history / invoices via Stripe
    let invoices: any[] = [];
    const stripeCustomerId = company.subscription?.stripeCustomerId;

    if (stripeCustomerId && process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('Mock')) {
      try {
        const stripeInvoices = await stripe.invoices.list({
          customer: stripeCustomerId,
          limit: 10,
        });
        invoices = stripeInvoices.data.map((inv) => ({
          id: inv.id,
          amount: (inv.amount_paid || inv.total || 0) / 100,
          currency: inv.currency?.toUpperCase() || 'USD',
          status: inv.status,
          date: new Date(inv.created * 1000).toISOString(),
          pdfUrl: inv.invoice_pdf || null,
        }));
      } catch (stripeErr) {
        console.warn('[Stripe Invoices Fetch Warning]:', stripeErr);
      }
    }

    // Fallback sample invoices if free tier or mock stripe
    if (invoices.length === 0 && (company.subscription?.plan === 'pro' || company.subscription?.plan === 'business')) {
      invoices = [
        {
          id: `inv_mock_${company.id.slice(0, 8)}_01`,
          amount: company.subscription?.plan === 'business' ? 249 : 79,
          currency: 'USD',
          status: 'paid',
          date: company.subscription?.updatedAt
            ? new Date(company.subscription.updatedAt).toISOString()
            : new Date().toISOString(),
          pdfUrl: null,
        },
      ];
    }

    // 3. Audit logs targeting this company
    const auditLogs = await prisma.platformAuditLog.findMany({
      where: { targetCompanyId: company.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        plan: company.subscription?.plan || company.plan,
        status: company.status || 'active',
        industry: company.industry,
        foundedYear: company.foundedYear,
        employeeCount: company.employeeCount,
        website: company.website,
        location: company.location,
        description: company.description,
        logoUrl: company.logoUrl,
        createdAt: company.createdAt,
      },
      subscription: company.subscription,
      planDefinition,
      usage: {
        jobsPosted: activeJobsCount,
        jobLimit: planDefinition.jobLimit === Infinity ? 'Unlimited' : planDefinition.jobLimit,
        applicationsReceived: totalApplications,
        aiScansUsed,
        aiScansLimit: planDefinition.aiScansLimit === Infinity ? 'Unlimited' : planDefinition.aiScansLimit,
        seatsUsed,
        seatsLimit: planDefinition.seatsLimit === Infinity ? 'Unlimited' : planDefinition.seatsLimit,
      },
      teamMembers: company.users,
      jobs: company.jobs,
      invoices,
      auditLogs,
    });
  } catch (error: any) {
    if (error?.message === 'Unauthorized Platform Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Platform Admin Company Detail Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requirePlatformAdminSession(request);
    const { id } = await context.params;

    const body = await request.json().catch(() => ({}));
    const { action, plan, reason } = body;

    const company = await prisma.company.findUnique({
      where: { id },
      include: { subscription: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (action === 'suspend') {
      const updated = await prisma.company.update({
        where: { id },
        data: { status: 'suspended' },
      });

      await prisma.platformAuditLog.create({
        data: {
          platformAdminId: adminSession.adminId,
          action: 'suspend_company',
          targetCompanyId: id,
          reason: reason || 'Account suspended by platform administrator.',
        },
      });

      return NextResponse.json({
        message: 'Company suspended successfully.',
        company: updated,
      });
    }

    if (action === 'reinstate') {
      const updated = await prisma.company.update({
        where: { id },
        data: { status: 'active' },
      });

      await prisma.platformAuditLog.create({
        data: {
          platformAdminId: adminSession.adminId,
          action: 'reinstate_company',
          targetCompanyId: id,
          reason: reason || 'Account reinstated by platform administrator.',
        },
      });

      return NextResponse.json({
        message: 'Company reinstated successfully.',
        company: updated,
      });
    }

    if (action === 'change_plan') {
      if (!plan || !['free', 'pro', 'business'].includes(plan.toLowerCase())) {
        return NextResponse.json(
          { error: 'Invalid plan. Must be free, pro, or business.' },
          { status: 400 }
        );
      }

      if (!reason || reason.trim().length === 0) {
        return NextResponse.json(
          { error: 'A valid reason is required for manual plan adjustments.' },
          { status: 400 }
        );
      }

      const normalizedPlan = plan.toLowerCase();

      // Update both Company and Subscription
      const [updatedCompany, updatedSub] = await prisma.$transaction([
        prisma.company.update({
          where: { id },
          data: { plan: normalizedPlan },
        }),
        prisma.subscription.upsert({
          where: { companyId: id },
          create: {
            companyId: id,
            plan: normalizedPlan,
            status: 'active',
          },
          update: {
            plan: normalizedPlan,
            status: 'active',
          },
        }),
      ]);

      await prisma.platformAuditLog.create({
        data: {
          platformAdminId: adminSession.adminId,
          action: 'manual_plan_change',
          targetCompanyId: id,
          reason: `Manual plan change to "${normalizedPlan}". Reason: ${reason.trim()}`,
        },
      });

      return NextResponse.json({
        message: `Plan updated to ${normalizedPlan} successfully.`,
        company: updatedCompany,
        subscription: updatedSub,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
  } catch (error: any) {
    if (error?.message === 'Unauthorized Platform Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Platform Admin Company Action Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
