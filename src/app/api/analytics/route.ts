import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canUseFeature } from '@/lib/enforcePlanLimit';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = session;

    // Feature Gating: Gated behind 'fullAnalytics'
    const gateCheck = await canUseFeature(companyId, 'fullAnalytics');
    if (!gateCheck.allowed) {
      return NextResponse.json(
        {
          error: gateCheck.reason || 'Upgrade to Pro to unlock full recruiting analytics',
          upgradeRequired: true,
          feature: 'fullAnalytics',
        },
        { status: 403 }
      );
    }

    // Fetch jobs and applications for full analytics
    const jobs = await prisma.job.findMany({
      where: { companyId },
      include: {
        applications: {
          select: {
            id: true,
            status: true,
            matchScore: true,
            testScore: true,
            violationLog: true,
            matchedSkills: true,
            missingSkills: true,
            createdAt: true,
          },
        },
      },
    });

    const allApplications = jobs.flatMap((j) => j.applications);
    const totalApplications = allApplications.length;

    // Stage counts
    const stageCounts: Record<string, number> = {
      applied: 0,
      screened: 0,
      tested: 0,
      interviewed: 0,
      hired: 0,
      rejected: 0,
    };

    let totalMatchScore = 0;
    let scoredMatchCount = 0;
    let totalTestScore = 0;
    let scoredTestCount = 0;
    let violationCount = 0;

    const skillCounts: Record<string, number> = {};
    const missingSkillCounts: Record<string, number> = {};

    allApplications.forEach((app) => {
      const stage = app.status || 'applied';
      if (stageCounts[stage] !== undefined) {
        stageCounts[stage]++;
      }

      if (app.matchScore !== null) {
        totalMatchScore += app.matchScore;
        scoredMatchCount++;
      }

      if (app.testScore !== null && app.testScore !== undefined) {
        totalTestScore += app.testScore;
        scoredTestCount++;
      }

      if (Array.isArray(app.violationLog) && app.violationLog.length > 0) {
        violationCount++;
      }

      if (Array.isArray(app.matchedSkills)) {
        app.matchedSkills.forEach((s: any) => {
          if (typeof s === 'string') {
            skillCounts[s] = (skillCounts[s] || 0) + 1;
          }
        });
      }

      if (Array.isArray(app.missingSkills)) {
        app.missingSkills.forEach((s: any) => {
          if (typeof s === 'string') {
            missingSkillCounts[s] = (missingSkillCounts[s] || 0) + 1;
          }
        });
      }
    });

    const avgMatchScore = scoredMatchCount > 0 ? Math.round(totalMatchScore / scoredMatchCount) : 0;
    const avgTestScore = scoredTestCount > 0 ? Math.round(totalTestScore / scoredTestCount) : 0;

    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    const topMissingSkills = Object.entries(missingSkillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      summary: {
        totalJobs: jobs.length,
        totalApplications,
        avgMatchScore,
        avgTestScore,
        violationRate: scoredTestCount > 0 ? Math.round((violationCount / scoredTestCount) * 100) : 0,
      },
      stageCounts,
      topSkills,
      topMissingSkills,
      conversionFunnel: [
        { stage: 'Applied', count: totalApplications, percentage: 100 },
        {
          stage: 'Screened',
          count: stageCounts.screened + stageCounts.tested + stageCounts.interviewed + stageCounts.hired,
          percentage: totalApplications > 0 ? Math.round(((stageCounts.screened + stageCounts.tested + stageCounts.interviewed + stageCounts.hired) / totalApplications) * 100) : 0,
        },
        {
          stage: 'Tested',
          count: stageCounts.tested + stageCounts.interviewed + stageCounts.hired,
          percentage: totalApplications > 0 ? Math.round(((stageCounts.tested + stageCounts.interviewed + stageCounts.hired) / totalApplications) * 100) : 0,
        },
        {
          stage: 'Interviewed',
          count: stageCounts.interviewed + stageCounts.hired,
          percentage: totalApplications > 0 ? Math.round(((stageCounts.interviewed + stageCounts.hired) / totalApplications) * 100) : 0,
        },
        {
          stage: 'Hired',
          count: stageCounts.hired,
          percentage: totalApplications > 0 ? Math.round((stageCounts.hired / totalApplications) * 100) : 0,
        },
      ],
    });
  } catch (error: any) {
    console.error('[Analytics API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve analytics metrics.' },
      { status: 500 }
    );
  }
}
