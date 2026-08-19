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
    const sortBy = searchParams.get('sortBy') || 'score'; // 'score' | 'date' | 'score_asc'

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
    });

    // Custom multi-field sorting:
    // Default ('score'): matchScore descending (non-null first, then highest score), then by createdAt desc.
    const sortedApplications = [...applications].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      if (sortBy === 'score_asc') {
        if (a.matchScore === null && b.matchScore === null) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (a.matchScore === null) return 1;
        if (b.matchScore === null) return -1;
        if (a.matchScore !== b.matchScore) return a.matchScore - b.matchScore;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      // Default: matchScore descending (nulls last)
      if (a.matchScore === null && b.matchScore === null) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (a.matchScore === null) return 1;
      if (b.matchScore === null) return -1;
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      applications: sortedApplications.map((app) => ({
        id: app.id,
        candidateName: app.candidateName,
        candidateEmail: app.candidateEmail,
        candidatePhone: app.candidatePhone,
        resumeUrl: app.resumeUrl,
        coverLetter: app.coverLetter,
        introTranscript: app.introTranscript,
        status: app.status,
        matchScore: app.matchScore,
        matchedSkills: app.matchedSkills,
        missingSkills: app.missingSkills,
        aiReasoning: app.aiReasoning,
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
