import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getGeminiErrorMessage, generateWithFallback } from '@/lib/gemini';
import { buildJobGenerationPrompt, parseGeneratedJobContent } from '@/lib/job-description';
import { prisma } from '@/lib/prisma';
import { generateJobSchema } from '@/lib/validations/job';

function extractAndParseJson(text: string): unknown {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // If markdown or conversational text wraps JSON, extract the outer-most JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Unable to parse JSON from AI response');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI generation is not configured. Set GEMINI_API_KEY in your environment.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = generateJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, experienceLevel = 'mid', keywords } = parsed.data;

    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      select: { name: true },
    });

    const prompt = buildJobGenerationPrompt(title, experienceLevel, company?.name, keywords);

    const { text } = await generateWithFallback(prompt, {
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    let rawResult: unknown;
    try {
      rawResult = extractAndParseJson(text);
    } catch {
      return NextResponse.json(
        { error: 'AI returned an invalid response. Please try again.' },
        { status: 502 }
      );
    }

    const generated = parseGeneratedJobContent(rawResult);
    if (!generated) {
      return NextResponse.json(
        { error: 'AI response missing required fields.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      description: generated.description,
      requiredSkills: generated.requiredSkills,
      sections: generated.sections,
    });
  } catch (error) {
    console.error('Generate job error:', error);
    return NextResponse.json({ error: getGeminiErrorMessage(error) }, { status: 500 });
  }
}
