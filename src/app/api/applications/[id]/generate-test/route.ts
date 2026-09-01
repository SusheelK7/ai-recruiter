import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { downloadFileBufferFromR2 } from '@/lib/r2';
import { extractTextFromResume } from '@/lib/resume-parser';
import { generateTestWithGemini, GeneratedQuestion } from '@/lib/test-generator';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Sanitizes questions for client delivery (stripping correctAnswer so it cannot be inspected).
 */
function sanitizeQuestionsForClient(questions: any) {
  let list: any[] = [];
  if (typeof questions === 'string') {
    try {
      list = JSON.parse(questions);
    } catch {
      list = [];
    }
  } else if (Array.isArray(questions)) {
    list = questions;
  } else if (questions && typeof questions === 'object' && Array.isArray(questions.questions)) {
    list = questions.questions;
  }

  const valid = list
    .filter((q: any) => q && typeof q.question === 'string' && Array.isArray(q.options))
    .map((q: any, index: number) => ({
      id: typeof q.id === 'number' ? q.id : index + 1,
      question: q.question,
      options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
    }));

  return valid.length > 0 ? valid : [];
}

/**
 * POST /api/applications/[id]/generate-test
 * Generates (or returns existing) personalized AI assessment test for the application.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: applicationId } = await params;

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is missing.' }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            requiredSkills: true,
            company: { select: { name: true } },
          },
        },
        candidateTest: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    // 1. If candidateTest already exists, return existing questions (fixed, not regenerated)
    if (application.candidateTest) {
      const storedQuestions = application.candidateTest.questions;
      const sanitized = sanitizeQuestionsForClient(storedQuestions);

      return NextResponse.json({
        success: true,
        testId: application.candidateTest.id,
        durationMinutes: application.candidateTest.durationMinutes || 20,
        startedAt: application.candidateTest.startedAt?.toISOString() || new Date().toISOString(),
        questions: sanitized,
        jobTitle: application.job?.title || 'Position',
        companyName: application.job?.company?.name || 'Company',
      });
    }

    // 2. Extract resume text from Cloudflare R2 with a safety timeout
    let resumeText = '';
    if (application.resumeUrl) {
      try {
        const timeoutPromise = new Promise<{ buffer: Buffer; contentType: string; filename: string }>((_, reject) =>
          setTimeout(() => reject(new Error('R2 download timed out')), 6000)
        );
        const { buffer, contentType, filename } = await Promise.race([
          downloadFileBufferFromR2(application.resumeUrl),
          timeoutPromise,
        ]);
        resumeText = await extractTextFromResume(buffer, contentType, filename);
      } catch (err: any) {
        console.warn('[Generate Test] Could not extract resume text from R2:', err?.message || err);
      }
    }

    // 3. Generate tailored MCQ questions using Gemini AI
    const generatedQuestions = await generateTestWithGemini({
      jobTitle: application.job?.title || 'Software Engineer',
      jobDescription: application.job?.description || 'Technical responsibilities',
      requiredSkills: (application.job?.requiredSkills as string[]) || [],
      candidateName: application.candidateName,
      resumeText: resumeText || application.coverLetter || '',
    });

    const now = new Date();

    // 4. Save CandidateTest record in database (upsert to handle concurrent requests safely)
    const testRecord = await prisma.candidateTest.upsert({
      where: { applicationId: application.id },
      update: {}, // Do not overwrite if created by a concurrent request
      create: {
        applicationId: application.id,
        questions: generatedQuestions as any,
        durationMinutes: 20,
        startedAt: now,
      },
    });

    const finalQuestions = testRecord.questions || generatedQuestions;
    const sanitized = sanitizeQuestionsForClient(finalQuestions);

    return NextResponse.json({
      success: true,
      testId: testRecord.id,
      durationMinutes: testRecord.durationMinutes,
      startedAt: testRecord.startedAt?.toISOString() || now.toISOString(),
      questions: sanitized,
      jobTitle: application.job?.title || 'Position',
      companyName: application.job?.company?.name || 'Company',
    });
  } catch (error: any) {
    console.error('Test generation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate assessment test.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/applications/[id]/generate-test
 * Read-only fetch of the current test questions (sanitized) if already created.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: applicationId } = await params;

    const [application, candidateTest] = await Promise.all([
      prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          job: { select: { title: true, company: { select: { name: true } } } },
        },
      }),
      prisma.candidateTest.findUnique({
        where: { applicationId },
      }),
    ]);

    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    if (!candidateTest) {
      return NextResponse.json(
        { error: 'Assessment not generated yet. Use POST to initialize.' },
        { status: 404 }
      );
    }

    const storedQuestions = candidateTest.questions;

    return NextResponse.json({
      success: true,
      testId: candidateTest.id,
      durationMinutes: candidateTest.durationMinutes,
      startedAt: candidateTest.startedAt?.toISOString(),
      submittedAt: candidateTest.submittedAt?.toISOString(),
      questions: sanitizeQuestionsForClient(storedQuestions),
      jobTitle: application.job.title,
      companyName: application.job.company.name,
      status: application.status,
    });
  } catch (error: any) {
    console.error('Fetch test error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch assessment.' },
      { status: 500 }
    );
  }
}
