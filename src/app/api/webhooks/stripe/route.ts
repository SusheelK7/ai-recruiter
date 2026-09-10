import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { getPlanByPriceId, type PlanKey } from '@/lib/plans';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.warn('[Stripe Webhook] Missing signature or STRIPE_WEBHOOK_SECRET');
      return NextResponse.json(
        { error: 'Missing signature or webhook secret configuration.' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(bodyText, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook Signature Verification Failed]:', err?.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`[Stripe Webhook Received] type: ${event.type} id: ${event.id}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const companyId =
          session.client_reference_id ||
          (session.metadata?.companyId as string | undefined);
        const planKey = (session.metadata?.plan as PlanKey | undefined) || 'pro';
        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        if (companyId) {
          let renewsAt: Date | null = null;

          if (subscriptionId) {
            try {
              const stripeSub: any = await stripe.subscriptions.retrieve(subscriptionId);
              if (stripeSub?.current_period_end) {
                renewsAt = new Date(stripeSub.current_period_end * 1000);
              }
            } catch (fetchSubErr) {
              console.warn('[Stripe Webhook] Could not retrieve subscription period:', fetchSubErr);
            }
          }

          // Update Subscription
          await prisma.subscription.upsert({
            where: { companyId },
            update: {
              plan: planKey,
              status: 'active',
              stripeCustomerId: customerId || undefined,
              stripeSubscriptionId: subscriptionId || undefined,
              renewsAt,
            },
            create: {
              companyId,
              plan: planKey,
              status: 'active',
              stripeCustomerId: customerId || undefined,
              stripeSubscriptionId: subscriptionId || undefined,
              renewsAt,
            },
          });

          // Sync Company.plan
          await prisma.company.update({
            where: { id: companyId },
            data: { plan: planKey },
          });

          console.log(`[Stripe Webhook] Company ${companyId} upgraded to ${planKey}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id;

        // Try to match by subscription ID or customer ID
        let subRecord = await prisma.subscription.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: subscription.id },
              ...(customerId ? [{ stripeCustomerId: customerId }] : []),
            ],
          },
        });

        if (!subRecord && subscription.metadata?.companyId) {
          subRecord = await prisma.subscription.findUnique({
            where: { companyId: subscription.metadata.companyId },
          });
        }

        if (subRecord) {
          const priceId = subscription.items?.data?.[0]?.price?.id;
          const detectedPlan = getPlanByPriceId(priceId);
          const planKey = (subscription.metadata?.plan as PlanKey) || detectedPlan.key;

          const periodEnd = (subscription as any)?.current_period_end;
          const renewsAt = periodEnd
            ? new Date(periodEnd * 1000)
            : null;

          const status = subscription.status === 'active' ? 'active' : subscription.status;

          await prisma.subscription.update({
            where: { id: subRecord.id },
            data: {
              plan: planKey,
              status,
              stripeSubscriptionId: subscription.id,
              renewsAt,
            },
          });

          await prisma.company.update({
            where: { id: subRecord.companyId },
            data: { plan: planKey },
          });

          console.log(`[Stripe Webhook] Subscription updated for company ${subRecord.companyId}: ${planKey}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id;

        let subRecord = await prisma.subscription.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: subscription.id },
              ...(customerId ? [{ stripeCustomerId: customerId }] : []),
            ],
          },
        });

        if (subRecord) {
          await prisma.subscription.update({
            where: { id: subRecord.id },
            data: {
              plan: 'free',
              status: 'canceled',
              renewsAt: null,
            },
          });

          await prisma.company.update({
            where: { id: subRecord.companyId },
            data: { plan: 'free' },
          });

          console.log(`[Stripe Webhook] Subscription canceled: company ${subRecord.companyId} reverted to free`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id;

        if (customerId) {
          const subRecord = await prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
          });

          if (subRecord) {
            // Flag subscription with payment_issue rather than immediate downgrade
            await prisma.subscription.update({
              where: { id: subRecord.id },
              data: {
                status: 'payment_issue',
              },
            });

            console.warn(
              `[Stripe Webhook] Invoice payment failed for customer ${customerId}. Company ${subRecord.companyId} flagged with payment_issue.`
            );
          }
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook Fatal Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
