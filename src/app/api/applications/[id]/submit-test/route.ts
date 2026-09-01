import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GeneratedQuestion } from '@/lib/test-generator';
import { sendApplicationConfirmationEmail } from '@/lib/email';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface SubmitTestBody {
  answers?: Record<string, string>;
  violationLog?: Array<{
    type: string;
    timestamp: string;
    details?: string;
  }>;
}

/**
 * POST /api/applications/[id]/submit-test
 * Grades candidate's MCQ assessment, saves score & violations, transitions status to 'applied',
 * and sends confirmation email.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: applicationId } = await params;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            title: true,
            company: { select: { name: true } },
          },
        },
        candidateTest: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    if (application.status !== 'test_pending') {
      return NextResponse.json(
        {
          error: 'This application test has already been submitted or finalized.',
          status: application.status,
        },
        { status: 400 }
      );
    }

    if (!application.candidateTest) {
      return NextResponse.json(
        { error: 'No assessment test was generated for this application.' },
        { status: 400 }
      );
    }

    const body: SubmitTestBody = await request.json().catch(() => ({}));
    const submittedAnswers = body.answers || {};
    const violationLog = Array.isArray(body.violationLog) ? body.violationLog : [];

    const questions = application.candidateTest.questions as unknown as GeneratedQuestion[];
    const totalQuestions = questions.length;

    // Grade MCQs via simple comparison logic against stored correctAnswer
    let correctCount = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      // Candidate answer might be keyed by question id or index (0-based / 1-based)
      const candidateAnswer =
        submittedAnswers[q.id] ||
        submittedAnswers[String(q.id)] ||
        submittedAnswers[i] ||
        submittedAnswers[String(i)];

      if (
        candidateAnswer &&
        typeof candidateAnswer === 'string' &&
        candidateAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
      ) {
        correctCount++;
      }
    }

    const testScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const now = new Date();

    // Update CandidateTest record with answers and submittedAt timestamp
    await prisma.candidateTest.update({
      where: { id: application.candidateTest.id },
      data: {
        answers: submittedAnswers as any,
        submittedAt: now,
      },
    });

    // Finalize Application: transition status from 'test_pending' to 'applied'
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'applied',
        testScore,
        violationLog: violationLog as any,
      },
    });

    // Send application confirmation email asynchronously in background
    sendApplicationConfirmationEmail({
      candidateEmail: updatedApplication.candidateEmail,
      candidateName: updatedApplication.candidateName,
      jobTitle: application.job.title,
      companyName: application.job.company.name,
    }).catch((emailErr) => {
      console.error('[Submit Test] Candidate confirmation email error:', emailErr);
    });

    // Return generic success message without leaking testScore or answer keys
    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully!',
      status: 'applied',
    });
  } catch (error: any) {
    console.error('Submit test error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit assessment.' },
      { status: 500 }
    );
  }
}
