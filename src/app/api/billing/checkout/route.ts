import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLANS, type PlanKey } from '@/lib/plans';
import { stripe, getAppBaseUrl } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = session;
    const body = await request.json().catch(() => ({}));
    const targetPlanKey = (body.plan || '').toLowerCase() as PlanKey;

    if (targetPlanKey !== 'pro' && targetPlanKey !== 'business') {
      return NextResponse.json(
        { error: 'Invalid plan selected. Choose "pro" or "business".' },
        { status: 400 }
      );
    }

    const targetPlan = PLANS[targetPlanKey];

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { subscription: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check if already on this plan or higher
    if (company.subscription?.plan === targetPlanKey) {
      return NextResponse.json(
        { error: `You are already subscribed to the ${targetPlan.name} plan.` },
        { status: 400 }
      );
    }

    let customerId = company.subscription?.stripeCustomerId;

    // In live or test mode, get or create Stripe customer
    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: company.email,
          name: company.name,
          metadata: {
            companyId: company.id,
          },
        });
        customerId = customer.id;

        await prisma.subscription.upsert({
          where: { companyId: company.id },
          update: { stripeCustomerId: customerId },
          create: {
            companyId: company.id,
            plan: company.plan || 'free',
            status: 'active',
            stripeCustomerId: customerId,
          },
        });
      } catch (custError: any) {
        console.warn('[Stripe Checkout] Customer creation fallback:', custError?.message);
      }
    }

    const baseUrl = getAppBaseUrl();

    // Prepare line item
    const lineItems: any[] = [];
    if (targetPlan.stripePriceId && targetPlan.stripePriceId.startsWith('price_')) {
      lineItems.push({
        price: targetPlan.stripePriceId,
        quantity: 1,
      });
    } else {
      // Inline price data for dynamic testing without preconfigured dashboard price IDs
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `AI Recruiter ${targetPlan.name} Plan`,
            description: targetPlan.tagline,
          },
          unit_amount: targetPlan.priceMonthly * 100,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      });
    }

    const isMockKey =
      !process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY.includes('Mock') ||
      process.env.STRIPE_SECRET_KEY.includes('mock');

    if (isMockKey) {
      const mockSessionId = `cs_test_mock_${Date.now()}`;
      const mockUrl = `${baseUrl}/dashboard/billing/checkout?plan=${targetPlan.key}&sessionId=${mockSessionId}`;
      return NextResponse.json({
        url: mockUrl,
        sessionId: mockSessionId,
      });
    }

    try {
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId || undefined,
        customer_email: customerId ? undefined : company.email,
        client_reference_id: company.id,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: lineItems,
        metadata: {
          companyId: company.id,
          plan: targetPlan.key,
        },
        subscription_data: {
          metadata: {
            companyId: company.id,
            plan: targetPlan.key,
          },
        },
        success_url: `${baseUrl}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}&plan=${targetPlan.key}`,
        cancel_url: `${baseUrl}/dashboard/billing?canceled=true`,
      });

      return NextResponse.json({
        url: checkoutSession.url,
        sessionId: checkoutSession.id,
      });
    } catch (stripeErr: any) {
      console.error('[Stripe Checkout Error]:', stripeErr);
      return NextResponse.json(
        {
          error: stripeErr.message || 'Failed to create checkout session. Please check Stripe configuration.',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Checkout Route Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during checkout initiation.' },
      { status: 500 }
    );
  }
}
