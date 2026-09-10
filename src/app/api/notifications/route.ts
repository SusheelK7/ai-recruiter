import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { backfillCompanyNotificationsIfEmpty } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = session;
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '40', 10)));

    // Ensure company has initial activity if empty
    await backfillCompanyNotificationsIfEmpty(companyId);

    const where: any = { companyId };
    if (unreadOnly) {
      where.read = false;
    }
    if (type && type !== 'all') {
      where.type = type;
    }

    const [notifications, unreadCount, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { companyId, read: false },
      }),
      prisma.notification.count({
        where: { companyId },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      totalCount,
    });
  } catch (error: any) {
    console.error('[Notifications GET Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve notifications.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = session;
    const body = await request.json().catch(() => ({}));
    const { id, read, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { companyId, read: false },
        data: { read: true },
      });

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read.',
        unreadCount: 0,
      });
    }

    if (id) {
      const updated = await prisma.notification.updateMany({
        where: { id, companyId },
        data: { read: read !== undefined ? !!read : true },
      });

      const unreadCount = await prisma.notification.count({
        where: { companyId, read: false },
      });

      return NextResponse.json({
        success: true,
        updatedCount: updated.count,
        unreadCount,
      });
    }

    return NextResponse.json(
      { error: 'Provide "id" or "markAllRead: true"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Notifications PATCH Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notification status.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = session;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      await prisma.notification.deleteMany({
        where: { companyId },
      });
      return NextResponse.json({
        success: true,
        message: 'All notifications cleared.',
      });
    }

    if (id) {
      await prisma.notification.deleteMany({
        where: { id, companyId },
      });
      return NextResponse.json({
        success: true,
        message: 'Notification deleted.',
      });
    }

    return NextResponse.json(
      { error: 'Provide "id" or "clearAll=true"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Notifications DELETE Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete notification.' },
      { status: 500 }
    );
  }
}
