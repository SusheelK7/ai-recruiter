import { prisma } from '@/lib/prisma';
import { getPlan, type FeatureKey, type PlanDefinition, FEATURE_NAMES } from '@/lib/plans';

export interface PlanLimitResult {
  allowed: boolean;
  reason?: string;
  plan: string;
  current?: number;
  limit?: number;
}

/**
 * Retrieves or creates a company's active subscription and its plan configuration.
 */
export async function getCompanySubscription(companyId: string): Promise<{
  subscription: {
    id: string;
    companyId: string;
    plan: string;
    status: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    renewsAt: Date | null;
  };
  plan: PlanDefinition;
}> {
  let sub = await prisma.subscription.findUnique({
    where: { companyId },
  });

  if (!sub) {
    // If company exists without subscription, link default Free subscription
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, plan: true },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    sub = await prisma.subscription.create({
      data: {
        companyId,
        plan: company.plan || 'free',
        status: 'active',
      },
    });
  }

  const plan = getPlan(sub.plan);
  return { subscription: sub, plan };
}

/**
 * Checks if the company can post an additional active job.
 */
export async function canPostJob(companyId: string): Promise<PlanLimitResult> {
  const { plan } = await getCompanySubscription(companyId);

  // Count active jobs for this company
  const activeJobCount = await prisma.job.count({
    where: {
      companyId,
      status: 'active',
    },
  });

  if (activeJobCount >= plan.jobLimit) {
    return {
      allowed: false,
      plan: plan.key,
      current: activeJobCount,
      limit: plan.jobLimit,
      reason: `Active job limit reached (${activeJobCount}/${plan.jobLimit} on ${plan.name} plan). Upgrade to ${
        plan.key === 'free' ? 'Pro' : 'Business'
      } to post more jobs.`,
    };
  }

  return {
    allowed: true,
    plan: plan.key,
    current: activeJobCount,
    limit: plan.jobLimit,
  };
}

/**
 * Checks if the company can perform an AI resume screening / scan.
 */
export async function canRunAiScan(companyId: string): Promise<PlanLimitResult> {
  const { plan } = await getCompanySubscription(companyId);

  // Count scored applications for jobs belonging to this company
  const scoredCount = await prisma.application.count({
    where: {
      job: { companyId },
      matchScore: { not: null },
    },
  });

  if (scoredCount >= plan.aiScansLimit) {
    return {
      allowed: false,
      plan: plan.key,
      current: scoredCount,
      limit: plan.aiScansLimit,
      reason: `AI candidate scan limit reached (${scoredCount}/${plan.aiScansLimit} on ${plan.name} plan). Upgrade to ${
        plan.key === 'free' ? 'Pro' : 'Business'
      } for more candidate screenings.`,
    };
  }

  return {
    allowed: true,
    plan: plan.key,
    current: scoredCount,
    limit: plan.aiScansLimit,
  };
}

/**
 * Checks if the company has access to a gated feature (e.g. videoIntro, secureTest, chatbot, fullAnalytics).
 */
export async function canUseFeature(
  companyId: string,
  featureKey: FeatureKey
): Promise<PlanLimitResult> {
  const { plan } = await getCompanySubscription(companyId);
  const isEnabled = !!plan.features[featureKey];

  if (!isEnabled) {
    const featureMeta = FEATURE_NAMES[featureKey];
    const featureName = featureMeta?.name || featureKey;

    let targetPlan = 'Pro';
    if (plan.key === 'pro') {
      targetPlan = 'Business';
    }

    return {
      allowed: false,
      plan: plan.key,
      reason: `Upgrade to ${targetPlan} to unlock ${featureName.toLowerCase()}.`,
    };
  }

  return {
    allowed: true,
    plan: plan.key,
  };
}
