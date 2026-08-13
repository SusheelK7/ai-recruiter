import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getGeminiErrorMessage, getGeminiModel } from '@/lib/gemini';
import {
  buildJobGenerationPrompt,
  parseGeneratedJobContent,
} from '@/lib/job-description';
import { prisma } from '@/lib/prisma';
import { generateJobSchema } from '@/lib/validations/job';

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

    const model = getGeminiModel();
    const prompt = buildJobGenerationPrompt(title, experienceLevel, company?.name, keywords);

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    let rawResult: unknown;
    try {
      const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      rawResult = JSON.parse(cleaned);
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
