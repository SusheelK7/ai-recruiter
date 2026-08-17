import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = session;
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId') || undefined;
    const status = searchParams.get('status') || undefined;

    // Get all jobs belonging to this company
    const companyJobs = await prisma.job.findMany({
      where: { companyId },
      select: { id: true },
    });

    const jobIds = companyJobs.map((j) => j.id);
    if (jobIds.length === 0) {
      return NextResponse.json({ applications: [] });
    }

    const applications = await prisma.application.findMany({
      where: {
        jobId: { in: jobIds },
        ...(jobId ? { jobId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        job: { select: { id: true, title: true, publicUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      applications: applications.map((app) => ({
        id: app.id,
        candidateName: app.candidateName,
        candidateEmail: app.candidateEmail,
        candidatePhone: app.candidatePhone,
        resumeUrl: app.resumeUrl,
        introTranscript: app.introTranscript,
        status: app.status,
        matchScore: app.matchScore,
        createdAt: app.createdAt.toISOString(),
        job: app.job,
      })),
    });
  } catch (error) {
    console.error('Applications list error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = session;
    const body = await request.json();
    const { applicationId, status } = body;

    const validStatuses = ['applied', 'screened', 'tested', 'interviewed', 'hired', 'rejected'];
    if (!applicationId || !status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid applicationId or status' }, { status: 400 });
    }

    // Verify the application belongs to this company
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: { select: { companyId: true } } },
    });

    if (!app || app.job.companyId !== companyId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });

    return NextResponse.json({ success: true, status: updated.status });
  } catch (error) {
    console.error('Update application status error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
