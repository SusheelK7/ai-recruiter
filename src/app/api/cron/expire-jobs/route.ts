import { NextRequest, NextResponse } from 'next/server';
import { autoCloseExpiredJobsAllCompanies } from '@/lib/jobs';

export async function GET(request: NextRequest) {
  return handleJobExpiration(request);
}

export async function POST(request: NextRequest) {
  return handleJobExpiration(request);
}

async function handleJobExpiration(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    const closedCount = await autoCloseExpiredJobsAllCompanies();

    return NextResponse.json({
      success: true,
      message: `Job expiration process completed. ${closedCount} job(s) auto-closed.`,
      closedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Scheduled job expiration error:', error);
    return NextResponse.json(
      { error: 'Failed to execute job expiration process' },
      { status: 500 }
    );
  }
}
