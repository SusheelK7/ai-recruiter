import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendInterviewScheduledEmail } from '@/lib/stage-emails';

/**
 * GET /api/interviews
 * Fetches all interviews for the authenticated recruiter's company,
 * categorized into 'upcoming' (sorted by scheduledTime ASC) and 'completed' (sorted by scheduledTime DESC).
 */
export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = session;

    // Fetch all applications with interview records belonging to this company's jobs
    const applicationsWithInterviews = await prisma.application.findMany({
      where: {
        job: { companyId },
        interview: { isNot: null },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        interview: true,
      },
    });

    const upcoming: any[] = [];
    const completed: any[] = [];

    for (const app of applicationsWithInterviews) {
      if (!app.interview) continue;

      const item = {
        id: app.interview.id,
        applicationId: app.id,
        candidateName: app.candidateName,
        candidateEmail: app.candidateEmail,
        candidatePhone: app.candidatePhone,
        jobId: app.job.id,
        jobTitle: app.job.title,
        matchScore: app.matchScore,
        testScore: app.testScore,
        applicationStatus: app.status,
        interviewStatus: app.interview.status, // "upcoming" | "completed" | "pending"
        scheduledTime: app.interview.scheduledTime ? app.interview.scheduledTime.toISOString() : null,
        resumeUrl: app.resumeUrl,
        videoUrl: app.videoUrl,
        createdAt: app.createdAt.toISOString(),
      };

      if (app.interview.status === 'completed') {
        completed.push(item);
      } else {
        upcoming.push(item);
      }
    }

    // Sort upcoming by scheduledTime ascending (soonest first, nulls last)
    upcoming.sort((a, b) => {
      if (!a.scheduledTime) return 1;
      if (!b.scheduledTime) return -1;
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    });

    // Sort completed by scheduledTime descending (most recent first)
    completed.sort((a, b) => {
      if (!a.scheduledTime) return 1;
      if (!b.scheduledTime) return -1;
      return new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime();
    });

    return NextResponse.json({
      upcoming,
      completed,
    });
  } catch (error) {
    console.error('[Interviews GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
  }
}

/**
 * POST /api/interviews
 * Schedules an interview for an application:
 * 1. Validates company ownership & future date/time.
 * 2. Creates/updates Interview record with status 'upcoming'.
 * 3. Updates Application status to 'interviewed'.
 * 4. Logs ActivityLog.
 * 5. Sends informational scheduled email.
 */
export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, userId } = session;
    const body = await request.json().catch(() => ({}));
    const { applicationId, scheduledTime, notes } = body;

    if (!applicationId || !scheduledTime) {
      return NextResponse.json(
        { error: 'Application ID and scheduled date/time are required.' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledTime);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date/time format provided.' },
        { status: 400 }
      );
    }

    // Validation: Prevent scheduling in the past
    // Allow a grace window of 1 minute for slight clock drift
    const now = new Date(Date.now() - 60000);
    if (scheduledDate < now) {
      return NextResponse.json(
        { error: 'Cannot schedule an interview in the past. Please select a future date and time.' },
        { status: 400 }
      );
    }

    // Verify company ownership of application
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
        interview: true,
      },
    });

    if (!application || application.job.companyId !== companyId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const previousStage = application.status;

    // Database updates in a transaction
    const [interviewRecord] = await prisma.$transaction([
      prisma.interview.upsert({
        where: { applicationId },
        update: {
          scheduledTime: scheduledDate,
          status: 'upcoming',
        },
        create: {
          applicationId,
          scheduledTime: scheduledDate,
          status: 'upcoming',
        },
      }),
      prisma.application.update({
        where: { id: applicationId },
        data: {
          status: 'interviewed',
        },
      }),
      prisma.activityLog.create({
        data: {
          applicationId,
          previousStage,
          newStage: 'interviewed',
          performedBy: userId || companyId || 'recruiter',
        },
      }),
    ]);

    // Send informational email to candidate
    let emailSent = false;
    let emailWarning: string | undefined;

    const candidateEmail = application.candidateEmail?.trim();
    if (!candidateEmail || !candidateEmail.includes('@')) {
      emailWarning = 'Candidate email is missing or invalid — notification email could not be sent';
    } else {
      emailSent = await sendInterviewScheduledEmail({
        candidateEmail,
        candidateName: application.candidateName,
        jobTitle: application.job.title,
        companyName: application.job.company.name,
        scheduledTime: scheduledDate,
        notes: notes?.trim() || null,
      });

      if (!emailSent) {
        emailWarning = 'Interview scheduled, but the confirmation email could not be sent';
      }
    }

    return NextResponse.json({
      success: true,
      interview: {
        id: interviewRecord.id,
        applicationId,
        scheduledTime: scheduledDate.toISOString(),
        status: 'upcoming',
      },
      emailSent,
      ...(emailWarning ? { emailWarning } : {}),
      message: 'Interview successfully scheduled!',
    });
  } catch (error) {
    console.error('[Interviews POST] Error:', error);
    return NextResponse.json({ error: 'Failed to schedule interview' }, { status: 500 });
  }
}
