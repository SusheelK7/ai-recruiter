import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job || job.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status === 'closed') {
      return NextResponse.json(
        { error: 'Job posting is already closed' },
        { status: 400 }
      );
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: { status: 'closed' },
      include: {
        _count: { select: { applications: true } },
      },
    });

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return NextResponse.json({
      job: {
        id: updatedJob.id,
        title: updatedJob.title,
        description: updatedJob.description,
        requiredSkills: updatedJob.requiredSkills,
        experienceLevel: updatedJob.experienceLevel,
        expiryDate: updatedJob.expiryDate?.toISOString() ?? null,
        publicUrl: updatedJob.publicUrl,
        publicLink: `${appBaseUrl}/jobs/${updatedJob.publicUrl}`,
        status: updatedJob.status,
        applicationsCount: updatedJob._count.applications,
        createdAt: updatedJob.createdAt.toISOString(),
      },
      message: 'Job posting closed successfully',
    });
  } catch (error) {
    console.error('Close job error:', error);
    return NextResponse.json({ error: 'Failed to close job' }, { status: 500 });
  }
}
