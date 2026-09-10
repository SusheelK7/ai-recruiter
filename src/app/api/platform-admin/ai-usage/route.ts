import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdminSession } from '@/lib/platformAdminAuth';
import { getPlatformAiMetrics, AI_UNIT_COSTS } from '@/lib/ai-costs';

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdminSession(request);

    const metrics = await getPlatformAiMetrics();

    return NextResponse.json({
      metrics: {
        totalCostThisMonth: metrics.totalCostThisMonth,
        totalEvents: metrics.totalEvents,
        totalResumeScans: metrics.totalResumeScans,
        totalTestEvals: metrics.totalTestEvals,
        totalVideoTranscriptions: metrics.totalVideoTranscriptions,
        totalChatbotMessages: metrics.totalChatbotMessages,
      },
      unitCosts: AI_UNIT_COSTS,
      companyBreakdown: metrics.companyBreakdown,
    });
  } catch (error: any) {
    if (error?.message === 'Unauthorized Platform Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Platform Admin AI Usage Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
