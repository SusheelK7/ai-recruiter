import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
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
    if (!subscription || subscription.plan === 'free') {
      return NextResponse.json(
        { error: 'You are already on the Free tier.' },
        { status: 400 }
      );
    }

    // Cancel on Stripe if active subscription exists
    if (subscription.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('Mock')) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } catch (stripeErr: any) {
        console.warn('[Stripe Subscription Cancel Warning]:', stripeErr?.message);
      }
    }

    // Downgrade local DB records to Free
    await prisma.subscription.update({
      where: { companyId },
      data: {
        plan: 'free',
        status: 'active',
        renewsAt: null,
      },
    });

    await prisma.company.update({
      where: { id: companyId },
      data: {
        plan: 'free',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Your subscription has been successfully canceled and reset to the Free tier.',
      plan: 'free',
    });
  } catch (error: any) {
    console.error('[Billing Cancel Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription.' },
      { status: 500 }
    );
  }
}
