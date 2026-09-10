import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/interviews/[id]/complete
 * Marks an upcoming interview as 'completed'.
 * Awaits post-interview hire / reject decision. Does not send any email.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: interviewId } = await params;
    const { companyId, userId } = session;

    // Fetch interview with application & job for ownership verification
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            job: {
              select: { companyId: true, title: true },
            },
          },
        },
      },
    });

    if (!interview || interview.application.job.companyId !== companyId) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    if (interview.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Interview is already marked as completed',
        interview: { id: interview.id, status: 'completed' },
      });
    }

    // Update interview status and log activity in a transaction
    const [updatedInterview] = await prisma.$transaction([
      prisma.interview.update({
        where: { id: interviewId },
        data: { status: 'completed' },
      }),
      prisma.activityLog.create({
        data: {
          applicationId: interview.applicationId,
          previousStage: 'interviewed',
          newStage: 'interview_completed',
          performedBy: userId || companyId || 'recruiter',
        },
      }),
    ]);

    await createNotification({
      companyId,
      type: 'interview',
      title: `Interview Completed: ${interview.application.candidateName}`,
      message: `Interview with ${interview.application.candidateName} for "${interview.application.job.title}" has been completed. Awaiting decision.`,
      link: `/dashboard/interviews`,
      metadata: { applicationId: interview.applicationId, interviewId },
    });

    return NextResponse.json({
      success: true,
      message: 'Interview marked as completed',
      interview: {
        id: updatedInterview.id,
        applicationId: interview.applicationId,
        status: updatedInterview.status,
      },
    });
  } catch (error) {
    console.error('[Interview Complete] Error:', error);
    return NextResponse.json({ error: 'Failed to mark interview as completed' }, { status: 500 });
  }
}
