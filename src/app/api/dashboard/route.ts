import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { expireStaleJobs, daysUntilExpiry } from '@/lib/jobs';
import { prisma } from '@/lib/prisma';

function mapApplicationStatusToFunnel(status: string): string {
  switch (status) {
    case 'applied':
      return 'Applied';
    case 'screened':
      return 'Screened';
    case 'tested':
      return 'Tested';
    case 'interviewed':
      return 'Interviewed';
    case 'hired':
      return 'Hired';
    default:
      return 'Applied';
  }
}

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = session;
    await expireStaleJobs(companyId);

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, plan: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const jobs = await prisma.job.findMany({
      where: { companyId },
      include: {
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const jobIds = jobs.map((job) => job.id);

    const applications = jobIds.length
      ? await prisma.application.findMany({
          where: { jobId: { in: jobIds } },
          include: {
            job: { select: { title: true } },
            interview: true,
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    const activeJobs = jobs.filter((job) => job.status === 'active').length;
    const totalApplications = applications.length;

    // Hired this month calculation
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const hiredThisMonth = applications.filter((app) => app.status === 'hired').length;

    // Interviews scheduled calculation
    const interviewsScheduled = applications.filter(
      (app) => app.interview !== null || ['interviewed', 'tested'].includes(app.status)
    ).length;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const applicationsThisWeek = applications.filter(
      (app) => app.createdAt >= oneWeekAgo
    ).length;

    const activeJobsLastWeek = jobs.filter((job) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return job.createdAt < weekAgo && job.status === 'active';
    }).length;

    const hiredThisWeek = applications.filter(
      (app) => app.status === 'hired' && app.createdAt >= oneWeekAgo
    ).length;

    const interviewsThisWeek = applications.filter(
      (app) =>
        (app.interview !== null || ['interviewed', 'tested'].includes(app.status)) &&
        app.createdAt >= oneWeekAgo
    ).length;

    const stats = {
      activeJobs,
      totalApplications,
      hiredThisMonth,
      interviewsScheduled,
      trends: {
        activeJobs: activeJobs - activeJobsLastWeek,
        totalApplications: applicationsThisWeek,
        hiredThisMonth: hiredThisWeek,
        interviewsScheduled: interviewsThisWeek,
      },
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentApplications = applications.filter(
      (app) => app.createdAt >= thirtyDaysAgo
    );

    const applicationsByDate = new Map<string, number>();
    for (let i = 29; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      applicationsByDate.set(key, 0);
    }

    for (const app of recentApplications) {
      const key = app.createdAt.toISOString().slice(0, 10);
      if (applicationsByDate.has(key)) {
        applicationsByDate.set(key, (applicationsByDate.get(key) ?? 0) + 1);
      }
    }

    const applicationsOverTime = Array.from(applicationsByDate.entries()).map(
      ([date, count]) => ({
        date,
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count,
      })
    );

    const funnelStages = ['Applied', 'Screened', 'Tested', 'Interviewed', 'Hired'];
    const funnelCounts: Record<string, number> = Object.fromEntries(
      funnelStages.map((stage) => [stage, 0])
    );

    for (const app of applications) {
      const stage = mapApplicationStatusToFunnel(app.status);
      funnelCounts[stage] = (funnelCounts[stage] ?? 0) + 1;
    }

    const hiringFunnel = funnelStages.map((stage) => ({
      stage,
      count: funnelCounts[stage] ?? 0,
    }));

    const jobPostings = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      status: job.status,
      applicationsCount: job._count.applications,
      daysUntilExpiry: daysUntilExpiry(job.expiryDate),
      publicUrl: job.publicUrl,
      createdAt: job.createdAt.toISOString(),
    }));

    // Upcoming / Scheduled Interviews list — only candidates selected for interview
    const upcomingInterviews = applications
      .filter((app) => app.status === 'interviewed' || app.interview !== null)
      .sort((a, b) => {
        // Sort by scheduled interview time (soonest first), fallback to createdAt
        const timeA = a.interview?.scheduledTime?.getTime() ?? a.createdAt.getTime();
        const timeB = b.interview?.scheduledTime?.getTime() ?? b.createdAt.getTime();
        return timeB - timeA;
      })
      .slice(0, 6)
      .map((app) => {
        let statusLabel = 'Scheduled';
        if (app.status === 'hired') statusLabel = 'Completed';
        else if (app.interview?.status) statusLabel = app.interview.status;

        return {
          id: app.id,
          candidateName: app.candidateName,
          jobTitle: app.job.title,
          scheduledTime: app.interview?.scheduledTime
            ? app.interview.scheduledTime.toISOString()
            : null,
          status: statusLabel,
          matchScore: app.matchScore,
        };
      });

    const activeJobIds = new Set(jobs.filter((job) => job.status === 'active').map((job) => job.id));

    const topCandidates = [...applications]
      .filter((app) => app.matchScore !== null && activeJobIds.has(app.jobId))
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
      .slice(0, 5)
      .map((app) => ({
        id: app.id,
        name: app.candidateName,
        jobTitle: app.job.title,
        matchScore: app.matchScore,
        status: app.status,
      }));

    // Recent Activity Feed from ActivityLog
    const recentActivityLogs = await prisma.activityLog.findMany({
      where: {
        application: {
          job: {
            companyId,
          },
        },
      },
      include: {
        application: {
          select: {
            candidateName: true,
            job: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentActivity = recentActivityLogs.map((log) => ({
      id: log.id,
      candidateName: log.application.candidateName,
      jobTitle: log.application.job.title,
      previousStage: log.previousStage,
      newStage: log.newStage,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      company,
      stats,
      applicationsOverTime,
      hiringFunnel,
      jobPostings,
      upcomingInterviews,
      topCandidates,
      recentActivity,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
