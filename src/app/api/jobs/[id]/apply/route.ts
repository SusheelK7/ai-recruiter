import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { expireStaleJobs } from '@/lib/jobs';
import { uploadResumeToR2 } from '@/lib/r2';
import { transcribeVideoWithGemini } from '@/lib/transcribe';
import { z } from 'zod';

const applySchema = z.object({
  candidateName: z.string().min(2, 'Name must be at least 2 characters'),
  candidateEmail: z.string().email('Invalid email address'),
  candidatePhone: z.string().min(7, 'Phone number must be at least 7 characters'),
});

const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: publicUrl } = await params;

    // 1. Fetch job by publicUrl (or id fallback) and run lazy expiration check
    let job = await prisma.job.findUnique({
      where: { publicUrl },
    });

    if (!job) {
      job = await prisma.job.findUnique({
        where: { id: publicUrl },
      });
    }

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job posting not found.' },
        { status: 404 }
      );
    }

    // Server-side job expiry check
    await expireStaleJobs(job.companyId);

    const refreshedJob = await prisma.job.findUnique({
      where: { id: job.id },
    });

    if (!refreshedJob) {
      return NextResponse.json(
        { success: false, error: 'Job posting not found.' },
        { status: 404 }
      );
    }

    const isExpired =
      refreshedJob.status !== 'active' ||
      (refreshedJob.expiryDate !== null && new Date(refreshedJob.expiryDate) < new Date());

    if (isExpired) {
      return NextResponse.json(
        { success: false, error: 'This job posting has closed and is no longer accepting applications.' },
        { status: 400 }
      );
    }

    // 2. Parse Multipart Form Data
    const formData = await request.formData();
    const candidateName = formData.get('candidateName') as string;
    const candidateEmail = formData.get('candidateEmail') as string;
    const candidatePhone = formData.get('candidatePhone') as string;
    const resumeFile = formData.get('resume') as File | null;
    const videoFile = formData.get('video') as File | null;

    // 3. Zod Field Validation
    const validation = applySchema.safeParse({
      candidateName,
      candidateEmail,
      candidatePhone,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Invalid form input.';
      return NextResponse.json(
        { success: false, error: firstError, details: validation.error.format() },
        { status: 400 }
      );
    }

    // 4. Resume Validation
    if (!resumeFile) {
      return NextResponse.json(
        { success: false, error: 'Resume file is required.' },
        { status: 400 }
      );
    }

    if (resumeFile.size > MAX_RESUME_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Resume file size exceeds the 5MB limit.' },
        { status: 400 }
      );
    }

    const resumeFileName = resumeFile.name.toLowerCase();
    const isPdfOrDocx =
      ALLOWED_RESUME_TYPES.includes(resumeFile.type) ||
      resumeFileName.endsWith('.pdf') ||
      resumeFileName.endsWith('.docx') ||
      resumeFileName.endsWith('.doc');

    if (!isPdfOrDocx) {
      return NextResponse.json(
        { success: false, error: 'Resume must be a PDF or DOCX document.' },
        { status: 400 }
      );
    }

    // 5. Video Validation
    if (!videoFile) {
      return NextResponse.json(
        { success: false, error: 'Video introduction is required.' },
        { status: 400 }
      );
    }

    // 6. Convert files to Buffers
    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());

    // 7. Upload Resume to Cloudflare R2
    const resumeUrl = await uploadResumeToR2(
      resumeBuffer,
      resumeFile.name,
      resumeFile.type || 'application/pdf'
    );

    // 8. Send Video DIRECTLY to Gemini API for in-memory transcription (never stored)
    const introTranscript = await transcribeVideoWithGemini(
      videoBuffer,
      videoFile.type || 'video/webm'
    );

    // 9. Save Application to Database
    const application = await prisma.application.create({
      data: {
        jobId: refreshedJob.id,
        candidateName,
        candidateEmail,
        candidatePhone,
        resumeUrl,
        introTranscript,
        status: 'applied',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully!',
      applicationId: application.id,
    });
  } catch (error: any) {
    console.error('Application submission error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An error occurred while processing your application.',
      },
      { status: 500 }
    );
  }
}
