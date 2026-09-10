import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLANS, type PlanKey } from '@/lib/plans';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = session;
    const body = await request.json().catch(() => ({}));
    const { plan: planKey, cardNumber, cvc, expDate, cardName } = body;

    const normalizedPlan = (planKey || '').toLowerCase() as PlanKey;
    if (normalizedPlan !== 'pro' && normalizedPlan !== 'business') {
      return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });
    }

    if (!cardNumber || !cvc || !expDate) {
      return NextResponse.json(
        { error: 'Please enter complete card details (number, expiry date, CVC).' },
        { status: 400 }
      );
    }

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 15) {
      return NextResponse.json(
        { error: 'Invalid card number. Please check your card digits.' },
        { status: 400 }
      );
    }

    // Simulate test card decline behavior (Stripe test cards)
    if (cleanCard.endsWith('0002') || cleanCard.endsWith('0069')) {
      return NextResponse.json(
        { error: 'Your card was declined. Please try a different test card.' },
        { status: 402 }
      );
    }

    const targetPlan = PLANS[normalizedPlan];
    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);

    const mockSubId = `sub_mock_${Date.now()}`;
    const mockCustId = `cus_mock_${Date.now()}`;

    // Update Subscription in database
    await prisma.subscription.upsert({
      where: { companyId },
      update: {
        plan: targetPlan.key,
        status: 'active',
        stripeCustomerId: mockCustId,
        stripeSubscriptionId: mockSubId,
        renewsAt,
      },
      create: {
        companyId,
        plan: targetPlan.key,
        status: 'active',
        stripeCustomerId: mockCustId,
        stripeSubscriptionId: mockSubId,
        renewsAt,
      },
    });

    // Sync Company plan
    await prisma.company.update({
      where: { id: companyId },
      data: { plan: targetPlan.key },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${targetPlan.name} plan.`,
      plan: targetPlan.key,
    });
  } catch (error: any) {
    console.error('[Mock Pay Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Payment processing failed.' },
      { status: 500 }
    );
  }
}
