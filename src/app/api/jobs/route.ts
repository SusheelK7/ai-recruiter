import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { generatePublicUrl, resolveExpiryDate } from '@/lib/jobs';
import { createJobSchema } from '@/lib/validations/job';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, requiredSkills, experienceLevel, expiryDays, customExpiryDate } =
      parsed.data;

    const expiryDate = resolveExpiryDate(expiryDays, customExpiryDate);
    const publicUrl = generatePublicUrl(title);
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const job = await prisma.job.create({
      data: {
        companyId: session.companyId,
        title,
        description,
        requiredSkills,
        experienceLevel,
        expiryDate,
        publicUrl,
        status: 'active',
      },
      include: {
        _count: { select: { applications: true } },
      },
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
