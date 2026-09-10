import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { PLANS, type PlanKey } from '@/lib/plans';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = session;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { subscription: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const subscription = company.subscription;
    const currentPlanKey = (subscription?.plan || company.plan || 'free') as PlanKey;
    const currentPlan = PLANS[currentPlanKey] || PLANS.free;

    let invoices: any[] = [];
    const stripeCustomerId = subscription?.stripeCustomerId;

    const isMockKey =
      !process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY.includes('Mock') ||
      process.env.STRIPE_SECRET_KEY.includes('mock');

    // 1. If we have a real Stripe customer, fetch live invoices from Stripe
    if (stripeCustomerId && !isMockKey) {
      try {
        const stripeInvoices = await stripe.invoices.list({
          customer: stripeCustomerId,
          limit: 24,
        });

        invoices = stripeInvoices.data.map((inv) => ({
          id: inv.id,
          number: inv.number || inv.id,
          amount: (inv.amount_paid || inv.total || 0) / 100,
          currency: (inv.currency || 'usd').toUpperCase(),
          status: inv.status || 'paid',
          date: new Date(inv.created * 1000).toISOString(),
          pdfUrl: inv.invoice_pdf || null,
          hostedUrl: inv.hosted_invoice_url || null,
          description: inv.lines?.data?.[0]?.description || `${currentPlan.name} Subscription`,
          planName: currentPlan.name,
          periodStart: inv.period_start ? new Date(inv.period_start * 1000).toISOString() : null,
          periodEnd: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
        }));
      } catch (stripeErr: any) {
        console.warn('[Stripe Invoices Fetch Warning]:', stripeErr?.message);
      }
    }

    // 2. Fallback / Mock invoices for paid plans if no live Stripe invoices returned
    if (invoices.length === 0 && (currentPlanKey === 'pro' || currentPlanKey === 'business')) {
      const price = currentPlan.priceMonthly;
      const subDate = subscription?.updatedAt || subscription?.createdAt || new Date();
      const invoiceDate = new Date(subDate);

      // Generate current cycle invoice
      invoices.push({
        id: `inv_mock_${company.id.slice(-6)}_${invoiceDate.getFullYear()}${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`,
        number: `INV-${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}${company.id.slice(-4).toUpperCase()}`,
        amount: price,
        currency: 'USD',
        status: subscription?.status === 'payment_issue' ? 'open' : 'paid',
        date: invoiceDate.toISOString(),
        pdfUrl: null,
        hostedUrl: null,
        description: `${currentPlan.name} Plan - Monthly Billing`,
        planName: currentPlan.name,
        periodStart: invoiceDate.toISOString(),
        periodEnd: subscription?.renewsAt ? new Date(subscription.renewsAt).toISOString() : null,
      });

      // If subscription is older, generate previous month as well
      const prevDate = new Date(invoiceDate);
      prevDate.setMonth(prevDate.getMonth() - 1);
      if (prevDate >= new Date(company.createdAt)) {
        invoices.push({
          id: `inv_mock_${company.id.slice(-6)}_${prevDate.getFullYear()}${String(prevDate.getMonth() + 1).padStart(2, '0')}`,
          number: `INV-${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}${company.id.slice(-4).toUpperCase()}`,
          amount: price,
          currency: 'USD',
          status: 'paid',
          date: prevDate.toISOString(),
          pdfUrl: null,
          hostedUrl: null,
          description: `${currentPlan.name} Plan - Monthly Billing`,
          planName: currentPlan.name,
          periodStart: prevDate.toISOString(),
          periodEnd: invoiceDate.toISOString(),
        });
      }
    }

    return NextResponse.json({
      invoices,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        location: company.location || 'United States',
      },
      subscription: {
        plan: currentPlanKey,
        planName: currentPlan.name,
        status: subscription?.status || 'active',
        renewsAt: subscription?.renewsAt ? subscription.renewsAt.toISOString() : null,
        stripeCustomerId: subscription?.stripeCustomerId || null,
      },
    });
  } catch (error: any) {
    console.error('[Billing Invoices Route Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve invoice history.' },
      { status: 500 }
    );
  }
}
