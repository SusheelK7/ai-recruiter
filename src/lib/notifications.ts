import { prisma } from '@/lib/prisma';

export type NotificationType =
  | 'application'
  | 'ai_screening'
  | 'test_completed'
  | 'interview'
  | 'stage_change'
  | 'billing'
  | 'system';

export interface CreateNotificationParams {
  companyId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Creates a notification safely. Logs and absorbs errors to prevent breaking user-facing requests.
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        companyId: params.companyId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
        metadata: params.metadata || {},
      },
    });
    return notification;
  } catch (error) {
    console.error('[Notification Creation Error]:', error);
    return null;
  }
}

/**
 * Backfills past activity logs as notifications if the company has zero notifications yet.
 */
export async function backfillCompanyNotificationsIfEmpty(companyId: string) {
  try {
    const count = await prisma.notification.count({ where: { companyId } });
    if (count > 0) return;

    // Fetch recent activity logs
    const activities = await prisma.activityLog.findMany({
      where: {
        application: {
          job: { companyId },
        },
      },
      include: {
        application: {
          include: { job: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    if (activities.length === 0) {
      // Seed welcome notification
      await prisma.notification.create({
        data: {
          companyId,
          type: 'system',
          title: 'Welcome to AI Recruiter Notification Center',
          message: 'Real-time alerts for candidate applications, AI resume screening scores, and interview bookings will appear here.',
          link: '/dashboard',
          read: false,
        },
      });
      return;
    }

    const notificationsToCreate = activities.map((act) => {
      const candidateName = act.application.candidateName;
      const jobTitle = act.application.job.title;
      let title = `Candidate Stage Update: ${candidateName}`;
      let type: NotificationType = 'stage_change';

      if (act.newStage === 'interview') {
        type = 'interview';
        title = `Interview Stage: ${candidateName}`;
      } else if (act.newStage === 'hired') {
        title = `🎉 Candidate Hired: ${candidateName}`;
      }

      return {
        companyId,
        type,
        title,
        message: `${candidateName} moved from ${act.previousStage} to ${act.newStage} for ${jobTitle}.`,
        link: `/dashboard/applications?jobId=${act.application.jobId}`,
        read: true,
        createdAt: act.createdAt,
      };
    });

    await prisma.notification.createMany({
      data: notificationsToCreate,
    });
  } catch (error) {
    console.warn('[Notification Backfill Notice]:', error);
  }
}
