export type PlanKey = 'free' | 'pro' | 'business';

export type FeatureKey = 'videoIntro' | 'secureTest' | 'chatbot' | 'fullAnalytics';

export interface PlanFeatures {
  videoIntro: boolean;
  secureTest: boolean;
  chatbot: boolean;
  fullAnalytics: boolean;
}

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  tagline: string;
  priceMonthly: number;
  stripePriceId?: string;
  jobLimit: number; // Maximum active jobs allowed
  aiScansLimit: number; // Maximum resume AI screenings allowed
  seatsLimit: number; // Maximum team members/users
  features: PlanFeatures;
  highlights: string[];
}

export const PLANS: Record<PlanKey, PlanDefinition> = {
  free: {
    key: 'free',
    name: 'Free',
    tagline: 'Ideal for early testing and single active hiring campaigns',
    priceMonthly: 0,
    jobLimit: 1,
    aiScansLimit: 50,
    seatsLimit: 1,
    features: {
      videoIntro: false,
      secureTest: false,
      chatbot: false,
      fullAnalytics: false,
    },
    highlights: [
      '1 active job posting',
      '50 AI resume scans',
      '1 recruiter seat',
      'Standard candidate intake',
      'Basic hiring pipeline',
    ],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    tagline: 'Supercharge your hiring with automated proctoring & AI video interviews',
    priceMonthly: 79,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_1ProMonthlyTestKey',
    jobLimit: 10,
    aiScansLimit: 500,
    seatsLimit: 3,
    features: {
      videoIntro: true,
      secureTest: true,
      chatbot: true,
      fullAnalytics: true,
    },
    highlights: [
      '10 active job postings',
      '500 AI resume screenings',
      '3 recruiter seats',
      'AI Video intro playback & transcription',
      'Anti-cheat proctored technical assessments',
      'AI Candidate Screening Chatbot',
      'Full recruitment analytics & metrics',
    ],
  },
  business: {
    key: 'business',
    name: 'Business',
    tagline: 'Scale talent acquisition across entire engineering & recruiting orgs',
    priceMonthly: 249,
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_1BusinessMonthlyTestKey',
    jobLimit: Infinity,
    aiScansLimit: 5000,
    seatsLimit: Infinity,
    features: {
      videoIntro: true,
      secureTest: true,
      chatbot: true,
      fullAnalytics: true,
    },
    highlights: [
      'Unlimited active job postings',
      '5,000 AI resume screenings',
      'Unlimited recruiter seats',
      'Everything in Pro included',
      'Priority AI generation & scoring latency',
      'Dedicated recruiter portal & invoices',
      'Full SLA & priority email support',
    ],
  },
};

export const FEATURE_NAMES: Record<FeatureKey, { name: string; description: string }> = {
  videoIntro: {
    name: 'AI Video Intro & Transcription',
    description: 'Watch candidate intro videos and generate AI transcripts with Google Gemini.',
  },
  secureTest: {
    name: 'Secure Anti-Cheat Technical Assessment',
    description: 'Dynamic personalized assessments with browser lockdown and violation logging.',
  },
  chatbot: {
    name: 'AI Recruiter Chatbot',
    description: 'Automated 24/7 candidate assistance, screening Q&A, and interview guidance.',
  },
  fullAnalytics: {
    name: 'Full Talent Analytics & Insights',
    description: 'Deep funnel conversion rates, skill-gap analysis, and hiring velocity trends.',
  },
};

export function getPlan(key: string | null | undefined): PlanDefinition {
  if (!key) return PLANS.free;
  const normalized = key.toLowerCase() as PlanKey;
  return PLANS[normalized] || PLANS.free;
}

export function getPlanByPriceId(priceId: string | null | undefined): PlanDefinition {
  if (!priceId) return PLANS.free;
  if (priceId === PLANS.business.stripePriceId) return PLANS.business;
  if (priceId === PLANS.pro.stripePriceId) return PLANS.pro;
  return PLANS.free;
}
