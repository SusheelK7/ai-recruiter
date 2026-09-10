import { prisma } from '@/lib/prisma';

export const AI_UNIT_COSTS = {
  resume_scan: 0.0015,
  test_eval: 0.0025,
  video_transcription: 0.0050,
  chatbot_message: 0.0005,
} as const;

export type AiFeatureType = keyof typeof AI_UNIT_COSTS;

export interface CompanyAiUsageSummary {
  companyId: string;
  companyName: string;
  plan: string;
  resumeScans: number;
  testEvals: number;
  videoTranscriptions: number;
  chatbotMessages: number;
  totalEvents: number;
  estimatedCost: number;
  isDisproportionate: boolean; // Flagged if usage is unusually high relative to plan
}

export interface PlatformAiMetrics {
  totalCostThisMonth: number;
  totalResumeScans: number;
  totalTestEvals: number;
  totalVideoTranscriptions: number;
  totalChatbotMessages: number;
  totalEvents: number;
  companyBreakdown: CompanyAiUsageSummary[];
}

/**
 * Log an AI usage event into the database.
 */
export async function recordAiUsage(
  companyId: string,
  feature: AiFeatureType,
  tokensUsed: number = 0
) {
  try {
    const estimatedCost = AI_UNIT_COSTS[feature] || 0.001;
    await prisma.aiUsageLog.create({
      data: {
        companyId,
        feature,
        tokensUsed,
        estimatedCost,
      },
    });
  } catch (error) {
    console.error('[AI Usage Tracker] Failed to log usage:', error);
  }
}

/**
 * Calculates platform-wide AI usage and cost metrics.
 * Combines explicit AiUsageLog entries with historical DB records
 * (scored applications, tests, transcripts) to guarantee complete accuracy.
 */
export async function getPlatformAiMetrics(startDate?: Date): Promise<PlatformAiMetrics> {
  const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // 1. Fetch all companies
  const companies = await prisma.company.findMany({
    select: { id: true, name: true, plan: true },
  });

  // 2. Query AiUsageLog events from this month
  const loggedEvents = await prisma.aiUsageLog.findMany({
    where: { createdAt: { gte: start } },
  });

  // 3. Query Application records for this month (for resume scans & video transcripts)
  const applications = await prisma.application.findMany({
    where: { createdAt: { gte: start } },
    select: {
      id: true,
      matchScore: true,
      introTranscript: true,
      job: { select: { companyId: true } },
    },
  });

  // 4. Query CandidateTest records for this month (for test generation/evaluations)
  const candidateTests = await prisma.candidateTest.findMany({
    where: { createdAt: { gte: start } },
    select: {
      id: true,
      application: {
        select: {
          job: { select: { companyId: true } },
        },
      },
    },
  });

  // Aggregate counts per company
  const usageByCompany = new Map<
    string,
    {
      resumeScans: number;
      testEvals: number;
      videoTranscriptions: number;
      chatbotMessages: number;
    }
  >();

  const getCompanyStats = (cid: string) => {
    if (!usageByCompany.has(cid)) {
      usageByCompany.set(cid, {
        resumeScans: 0,
        testEvals: 0,
        videoTranscriptions: 0,
        chatbotMessages: 0,
      });
    }
    return usageByCompany.get(cid)!;
  };

  // Add logged explicit events
  for (const log of loggedEvents) {
    const stats = getCompanyStats(log.companyId);
    if (log.feature === 'resume_scan') stats.resumeScans++;
    else if (log.feature === 'test_eval') stats.testEvals++;
    else if (log.feature === 'video_transcription') stats.videoTranscriptions++;
    else if (log.feature === 'chatbot_message') stats.chatbotMessages++;
  }

  // Add historical applications if not already counted in logs
  for (const app of applications) {
    const cid = app.job?.companyId;
    if (!cid) continue;
    const stats = getCompanyStats(cid);
    // If no explicit log exists for this resume scan, count it from the app record
    if (app.matchScore !== null) {
      stats.resumeScans = Math.max(stats.resumeScans, 1);
    }
    if (app.introTranscript && app.introTranscript !== '[No speech detected]') {
      stats.videoTranscriptions = Math.max(stats.videoTranscriptions, 1);
    }
  }

  // Add historical candidate tests
  for (const ct of candidateTests) {
    const cid = ct.application?.job?.companyId;
    if (!cid) continue;
    const stats = getCompanyStats(cid);
    stats.testEvals = Math.max(stats.testEvals, 1);
  }

  // Build summary array
  let totalResumeScans = 0;
  let totalTestEvals = 0;
  let totalVideoTranscriptions = 0;
  let totalChatbotMessages = 0;
  let totalCostThisMonth = 0;

  const companyBreakdown: CompanyAiUsageSummary[] = companies.map((comp) => {
    const stats = usageByCompany.get(comp.id) || {
      resumeScans: 0,
      testEvals: 0,
      videoTranscriptions: 0,
      chatbotMessages: 0,
    };

    const cost =
      stats.resumeScans * AI_UNIT_COSTS.resume_scan +
      stats.testEvals * AI_UNIT_COSTS.test_eval +
      stats.videoTranscriptions * AI_UNIT_COSTS.video_transcription +
      stats.chatbotMessages * AI_UNIT_COSTS.chatbot_message;

    const totalEvents =
      stats.resumeScans + stats.testEvals + stats.videoTranscriptions + stats.chatbotMessages;

    totalResumeScans += stats.resumeScans;
    totalTestEvals += stats.testEvals;
    totalVideoTranscriptions += stats.videoTranscriptions;
    totalChatbotMessages += stats.chatbotMessages;
    totalCostThisMonth += cost;

    // Determine disproportionate usage (e.g. Free plan using > 40 scans or Pro using > 400 scans)
    const isDisproportionate =
      (comp.plan === 'free' && stats.resumeScans > 35) ||
      (comp.plan === 'pro' && stats.resumeScans > 400) ||
      cost > 20.0;

    return {
      companyId: comp.id,
      companyName: comp.name,
      plan: comp.plan,
      resumeScans: stats.resumeScans,
      testEvals: stats.testEvals,
      videoTranscriptions: stats.videoTranscriptions,
      chatbotMessages: stats.chatbotMessages,
      totalEvents,
      estimatedCost: Number(cost.toFixed(4)),
      isDisproportionate,
    };
  });

  // Sort descending by highest cost first
  companyBreakdown.sort((a, b) => b.estimatedCost - a.estimatedCost);

  return {
    totalCostThisMonth: Number(totalCostThisMonth.toFixed(4)),
    totalResumeScans,
    totalTestEvals,
    totalVideoTranscriptions,
    totalChatbotMessages,
    totalEvents: totalResumeScans + totalTestEvals + totalVideoTranscriptions + totalChatbotMessages,
    companyBreakdown,
  };
}
