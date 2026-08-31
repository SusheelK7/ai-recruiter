import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { downloadVideoFromR2 } from '@/lib/r2';

/**
 * GET /api/applications/[id]/video
 * Streams or downloads the candidate's video recording from R2.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: applicationId } = await params;
    const { companyId } = session;

    // Fetch application and verify it belongs to the recruiter's company
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: { select: { companyId: true } } },
    });

    if (!application || application.job.companyId !== companyId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!application.videoUrl) {
      return NextResponse.json({ error: 'No video found for this application' }, { status: 404 });
    }

    // Download / stream file from R2
    const { body, contentType, filename } = await downloadVideoFromR2(application.videoUrl);

    const webStream = body instanceof ReadableStream
      ? body
      : new ReadableStream({
          start(controller) {
            const nodeStream = body as NodeJS.ReadableStream;
            nodeStream.on('data', (chunk: Buffer) => {
              controller.enqueue(new Uint8Array(chunk));
            });
            nodeStream.on('end', () => {
              controller.close();
            });
            nodeStream.on('error', (err: Error) => {
              controller.error(err);
            });
          },
        });

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'video/webm',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error: any) {
    console.error('Video streaming error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to stream video' },
      { status: 500 }
    );
  }
}
