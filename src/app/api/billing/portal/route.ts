import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe, getAppBaseUrl } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = session;

    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
    });

    const baseUrl = getAppBaseUrl();

    const isMockKey =
      !process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY.includes('Mock') ||
      process.env.STRIPE_SECRET_KEY.includes('mock');

    // In mock mode or if company hasn't connected a real stripe customer, fallback to in-app portal
    if (isMockKey || !subscription?.stripeCustomerId) {
      return NextResponse.json({
        url: null,
        inAppPortal: true,
        message: 'Opening in-app billing manager.',
      });
    }

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${baseUrl}/dashboard/billing`,
      });

      return NextResponse.json({
        url: portalSession.url,
        inAppPortal: false,
      });
    } catch (portalError: any) {
      console.warn('[Stripe Customer Portal Notice]: Customer portal not active on Stripe dashboard. Using in-app billing manager fallback.', portalError?.message);
      return NextResponse.json({
        url: null,
        inAppPortal: true,
        notice: 'Stripe Customer Portal is not configured in your Stripe Dashboard. In-app billing management is active.',
      });
    }
  } catch (error: any) {
    console.error('[Billing Portal Route Error]:', error);
    return NextResponse.json(
      {
        url: null,
        inAppPortal: true,
        error: error.message || 'Internal server error while opening billing portal.',
      },
      { status: 200 }
    );
  }
}
