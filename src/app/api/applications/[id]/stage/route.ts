import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendStageEmail } from '@/lib/stage-emails';

const VALID_STAGES = ['applied', 'screened', 'tested', 'interviewed', 'hired', 'rejected'] as const;
type PipelineStage = (typeof VALID_STAGES)[number];

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/applications/[id]/stage
 *
 * Updates the pipeline stage for an application, logs the change,
 * and sends a stage-appropriate email to the candidate.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Authenticate
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: applicationId } = await params;
    const { companyId, userId } = session;

    // 2. Parse and validate request body
    let body: { stage?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { stage } = body;
    if (!stage || !VALID_STAGES.includes(stage as PipelineStage)) {
      return NextResponse.json(
        { error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}` },
        { status: 400 }
      );
    }

    // 3. Fetch application with company ownership check
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            companyId: true,
            title: true,
            company: { select: { name: true } },
          },
        },
      },
    });

    if (!application || application.job.companyId !== companyId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // 4. Same-stage check — no-op, no duplicate email
    if (application.status === stage) {
      return NextResponse.json({
        success: true,
        noChange: true,
        status: stage,
        emailSent: false,
        message: 'Application is already in this stage',
      });
    }

    const previousStage = application.status;

    // 5. Update application status + create activity log in a transaction
    await prisma.$transaction([
      prisma.application.update({
        where: { id: applicationId },
        data: { status: stage },
      }),
      prisma.activityLog.create({
        data: {
          applicationId,
          previousStage,
          newStage: stage,
          performedBy: userId || companyId || 'recruiter',
        },
      }),
    ]);

    // 6. Send stage-appropriate email (non-blocking for the DB update)
    let emailSent = false;
    let emailWarning: string | undefined;

    const candidateEmail = application.candidateEmail?.trim();
    if (!candidateEmail || !candidateEmail.includes('@')) {
      emailWarning = 'Candidate email is missing or invalid — notification could not be sent';
    } else {
      const emailResult = await sendStageEmail(stage, {
        candidateEmail,
        candidateName: application.candidateName,
        jobTitle: application.job.title,
        companyName: application.job.company.name,
      });

      if (emailResult.skipped) {
        // Stages like 'applied' and 'screened' don't send emails
        emailWarning = undefined;
      } else {
        emailSent = emailResult.sent;
        if (!emailSent) {
          emailWarning = 'Stage updated, but the notification email could not be sent';
        }
      }
    }

    return NextResponse.json({
      success: true,
      noChange: false,
      status: stage,
      previousStage,
      emailSent,
      ...(emailWarning ? { emailWarning } : {}),
    });
  } catch (error) {
    console.error('[Stage Update] Error:', error);
    return NextResponse.json({ error: 'Failed to update pipeline stage' }, { status: 500 });
  }
}
