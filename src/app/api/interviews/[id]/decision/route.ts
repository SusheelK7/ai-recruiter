import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendStageEmail } from '@/lib/stage-emails';
import { createNotification } from '@/lib/notifications';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_DECISIONS = ['hired', 'rejected'] as const;
type Decision = (typeof VALID_DECISIONS)[number];

/**
 * POST /api/interviews/[id]/decision
 * Records post-interview decision ('hired' | 'rejected') on a COMPLETED interview.
 * Updates Application status, creates ActivityLog, and triggers corresponding Hired/Rejected email.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: interviewId } = await params;
    const { companyId, userId } = session;

    const body = await request.json().catch(() => ({}));
    let decision = body.decision?.toLowerCase();
    if (decision === 'not_selected' || decision === 'not selected') {
      decision = 'rejected';
    }

    if (!decision || !VALID_DECISIONS.includes(decision as Decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be "hired" or "rejected" ("not_selected").' },
        { status: 400 }
      );
    }

    // Fetch interview with application and company info
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            job: {
              select: {
                companyId: true,
                title: true,
                company: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!interview || interview.application.job.companyId !== companyId) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Validation Guard: Must be completed first
    if (interview.status !== 'completed') {
      return NextResponse.json(
        {
          error:
            'Decisions can only be made on completed interviews. Please mark the interview as completed before submitting a hire or rejection decision.',
        },
        { status: 400 }
      );
    }

    const application = interview.application;
    const previousStage = application.status;

    // Update Application status and log activity
    await prisma.$transaction([
      prisma.application.update({
        where: { id: application.id },
        data: { status: decision },
      }),
      prisma.activityLog.create({
        data: {
          applicationId: application.id,
          previousStage,
          newStage: decision,
          performedBy: userId || companyId || 'recruiter',
        },
      }),
    ]);

    await createNotification({
      companyId,
      type: decision === 'hired' ? 'stage_change' : 'stage_change',
      title: decision === 'hired' ? `🎉 Offer Accepted: ${application.candidateName}` : `Candidate Rejected: ${application.candidateName}`,
      message: `${application.candidateName} was marked as ${decision} for "${application.job.title}".`,
      link: `/dashboard/interviews`,
      metadata: { applicationId: application.id, interviewId, decision },
    });

    // Send stage email (Hired or Rejected)
    let emailSent = false;
    let emailWarning: string | undefined;

    const candidateEmail = application.candidateEmail?.trim();
    if (!candidateEmail || !candidateEmail.includes('@')) {
      emailWarning = 'Candidate email is missing or invalid — notification email could not be sent';
    } else {
      const emailResult = await sendStageEmail(decision, {
        candidateEmail,
        candidateName: application.candidateName,
        jobTitle: application.job.title,
        companyName: application.job.company.name,
      });

      emailSent = emailResult.sent;
      if (!emailSent) {
        emailWarning = `Candidate marked as ${decision}, but notification email could not be sent`;
      }
    }

    return NextResponse.json({
      success: true,
      decision,
      applicationId: application.id,
      emailSent,
      ...(emailWarning ? { emailWarning } : {}),
      message:
        decision === 'hired'
          ? 'Candidate marked as Hired — offer email sent!'
          : 'Candidate marked as Not Selected — status update email sent.',
    });
  } catch (error) {
    console.error('[Interview Decision] Error:', error);
    return NextResponse.json({ error: 'Failed to record interview decision' }, { status: 500 });
  }
}
