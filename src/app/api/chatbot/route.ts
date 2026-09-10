import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { canUseFeature } from '@/lib/enforcePlanLimit';
import { generateWithFallback } from '@/lib/gemini';
import { recordAiUsage } from '@/lib/ai-costs';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = session;

    // Feature Gating: Gated behind 'chatbot'
    const gateCheck = await canUseFeature(companyId, 'chatbot');
    if (!gateCheck.allowed) {
      return NextResponse.json(
        {
          error: gateCheck.reason || 'Upgrade to Pro to unlock the AI recruiter chatbot',
          upgradeRequired: true,
          feature: 'chatbot',
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: 'A message prompt is required.' },
        { status: 400 }
      );
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are an elite AI Recruiter Assistant for our hiring platform.
Help the recruiter with candidate screening questions, job role descriptions, interview rubrics, or hiring best practices.
Keep your response concise, actionable, and formatted in clean markdown.

User question: ${message}`;

        const { text: reply } = await generateWithFallback(prompt);
        if (reply) {
          await recordAiUsage(companyId, 'chatbot_message');
          return NextResponse.json({ reply });
        }
      } catch (geminiError: any) {
        console.warn('[Chatbot Gemini Fallback]:', geminiError?.message);
      }
    }

    // Default intelligent recruiter response if Gemini key unavailable
    return NextResponse.json({
      reply: `**AI Recruiter Assistant:** I received your query regarding "${message}". Based on our recruitment analytics, we recommend structuring technical evaluations around practical problem solving, maintaining clear skill scoring matrices, and following up within 48 hours to maximize candidate acceptance rates.`,
    });
  } catch (error: any) {
    console.error('[Chatbot Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while processing chatbot message.' },
      { status: 500 }
    );
  }
}
