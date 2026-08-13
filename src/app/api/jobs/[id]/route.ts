import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { resolveExpiryDate } from '@/lib/jobs';
import { updateJobSchema } from '@/lib/validations/job';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        _count: { select: { applications: true } },
      },
    });

    if (!job || job.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return NextResponse.json({
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        requiredSkills: job.requiredSkills,
        experienceLevel: job.experienceLevel,
        expiryDate: job.expiryDate?.toISOString() ?? null,
        publicUrl: job.publicUrl,
        publicLink: `${appBaseUrl}/jobs/${job.publicUrl}`,
        status: job.status,
        applicationsCount: job._count.applications,
        createdAt: job.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get job error:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob || existingJob.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      requiredSkills,
      experienceLevel,
      expiryDays,
      customExpiryDate,
      status,
    } = parsed.data;

    let updatedExpiryDate: Date | null | undefined = undefined;
    if (expiryDays !== undefined || customExpiryDate !== undefined) {
      if (customExpiryDate) {
        updatedExpiryDate = resolveExpiryDate(undefined, customExpiryDate);
      } else if (expiryDays) {
        updatedExpiryDate = resolveExpiryDate(expiryDays, undefined);
      }
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(requiredSkills !== undefined && { requiredSkills }),
        ...(experienceLevel !== undefined && { experienceLevel }),
        ...(updatedExpiryDate !== undefined && { expiryDate: updatedExpiryDate }),
        ...(status !== undefined && { status }),
      },
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
    });
  } catch (error) {
    console.error('Update job error:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}
