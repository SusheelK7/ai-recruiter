import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { expireStaleJobs } from '@/lib/jobs';
import { uploadResumeToR2 } from '@/lib/r2';
import { transcribeVideoWithGemini } from '@/lib/transcribe';
import {
  extractTextFromResume,
  validateResumeText,
} from '@/lib/resume-parser';
import { scoreResumeWithGemini } from '@/lib/resume-scoring';
import { sendApplicationConfirmationEmail } from '@/lib/email';
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
      include: { company: { select: { name: true } } },
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
    const coverLetterRaw = formData.get('coverLetter') as string | null;
    const coverLetter = coverLetterRaw ? coverLetterRaw.trim() : null;
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

    // 4. Resume File Presence & Size Validation
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

    // 7. Resume Text Extraction & Server-side Content Validation BEFORE any AI Call
    let extractedResumeText = '';
    try {
      extractedResumeText = await extractTextFromResume(
        resumeBuffer,
        resumeFile.type,
        resumeFile.name
      );
    } catch (parseError) {
      console.warn('Resume file parsing error:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: "We couldn't read your resume file. Please upload a valid PDF or DOCX file.",
        },
        { status: 400 }
      );
    }

    const textValidation = validateResumeText(extractedResumeText);
    if (!textValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error:
            textValidation.error ||
            "This doesn't appear to be a valid resume. Please check your file and try again.",
        },
        { status: 400 }
      );
    }

    // 8. Upload Resume to Cloudflare R2
    const resumeUrl = await uploadResumeToR2(
      resumeBuffer,
      resumeFile.name,
      resumeFile.type || 'application/pdf'
    );

    // 9. Send Video DIRECTLY to Gemini API for in-memory transcription (never stored)
    const introTranscript = await transcribeVideoWithGemini(
      videoBuffer,
      videoFile.type || 'video/webm'
    );

    // 10. AI Resume Screening & Scoring with Gemini (only runs on valid resumes)
    let scoringResult = null;
    try {
      scoringResult = await scoreResumeWithGemini({
        resumeText: extractedResumeText,
        jobTitle: refreshedJob.title,
        jobDescription: refreshedJob.description,
        requiredSkills: (refreshedJob.requiredSkills as string[]) || [],
      });
    } catch (scoringError) {
      console.error('AI resume scoring encountered error, proceeding with pending status:', scoringError);
    }

    // 11. Save Application to Database
    const application = await prisma.application.create({
      data: {
        jobId: refreshedJob.id,
        candidateName,
        candidateEmail,
        candidatePhone,
        resumeUrl,
        coverLetter,
        introTranscript,
        matchScore: scoringResult ? scoringResult.score : null,
        matchedSkills: scoringResult ? scoringResult.matchedSkills : undefined,
        missingSkills: scoringResult ? scoringResult.missingSkills : undefined,
        aiReasoning: scoringResult ? scoringResult.reasoning : null,
        status: scoringResult ? 'screened' : 'applied',
      },
    });

    // 12. Send confirmation email to candidate
    try {
      await sendApplicationConfirmationEmail({
        candidateEmail,
        candidateName,
        jobTitle: refreshedJob.title,
        companyName: refreshedJob.company.name,
      });
    } catch (emailErr) {
      console.error('[Application POST] Candidate email notification error:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully!',
      applicationId: application.id,
      matchScore: application.matchScore,
      matchedSkills: application.matchedSkills,
      missingSkills: application.missingSkills,
      aiReasoning: application.aiReasoning,
      status: application.status,
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
