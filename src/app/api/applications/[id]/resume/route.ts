import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { downloadResumeFromR2 } from '@/lib/r2';

/**
 * GET /api/applications/[id]/resume
 * Streams the candidate's resume file from R2 as a download.
 * Requires authentication and verifies the application belongs to the company.
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

    // Fetch the application and verify it belongs to the company
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: { select: { companyId: true } } },
    });

    if (!application || application.job.companyId !== companyId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!application.resumeUrl) {
      return NextResponse.json({ error: 'No resume found for this application' }, { status: 404 });
    }

    // Download file from R2
    const { body, contentType, filename } = await downloadResumeFromR2(application.resumeUrl);

    // Convert the R2 SDK stream to a web ReadableStream for the Response
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
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error: any) {
    console.error('Resume download error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to download resume' },
      { status: 500 }
    );
  }
}
