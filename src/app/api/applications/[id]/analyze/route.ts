import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { downloadFileBufferFromR2 } from '@/lib/r2';
import { extractTextFromResume } from '@/lib/resume-parser';
import { scoreResumeWithGemini } from '@/lib/resume-scoring';
import { transcribeVideoWithGemini } from '@/lib/transcribe';

export async function POST(
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

    let body: { type?: 'all' | 'resume' | 'video' } = {};
    try {
      body = await request.json();
    } catch {
      // default to 'all' if empty body
    }
    const analyzeType = body.type || 'all';

    // Verify application belongs to this company
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            requiredSkills: true,
            companyId: true,
          },
        },
      },
    });

    if (!application || application.job.companyId !== companyId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};

    // 1. Analyze Resume with Gemini AI
    if (analyzeType === 'all' || analyzeType === 'resume') {
      if (!application.resumeUrl) {
        return NextResponse.json(
          { error: 'No resume found for this application to analyze.' },
          { status: 400 }
        );
      }

      try {
        const { buffer, contentType, filename } = await downloadFileBufferFromR2(
          application.resumeUrl
        );

        const extractedResumeText = await extractTextFromResume(
          buffer,
          contentType,
          filename
        );

        const scoringResult = await scoreResumeWithGemini({
          resumeText: extractedResumeText,
          jobTitle: application.job.title,
          jobDescription: application.job.description,
          requiredSkills: (application.job.requiredSkills as string[]) || [],
        });

        if (scoringResult) {
          updateData.matchScore = scoringResult.score;
          updateData.matchedSkills = scoringResult.matchedSkills;
          updateData.missingSkills = scoringResult.missingSkills;
          updateData.aiReasoning = scoringResult.reasoning;
          if (application.status === 'applied') {
            updateData.status = 'screened';
          }
        }
      } catch (resumeError: any) {
        console.error('[On-Demand AI] Resume analysis error:', resumeError);
        return NextResponse.json(
          { error: `Failed to analyze resume: ${resumeError.message || 'Unknown error'}` },
          { status: 500 }
        );
      }
    }

    // 2. Transcribe Video with Gemini AI
    if (analyzeType === 'all' || analyzeType === 'video') {
      if (application.videoUrl) {
        try {
          const { buffer, contentType } = await downloadFileBufferFromR2(
            application.videoUrl
          );

          const transcript = await transcribeVideoWithGemini(buffer, contentType);
          if (transcript) {
            updateData.introTranscript = transcript;
          }
        } catch (videoError: any) {
          console.error('[On-Demand AI] Video transcription error:', videoError);
          // If analyzing 'all', don't completely fail if only video failed
          if (analyzeType === 'video') {
            return NextResponse.json(
              { error: `Failed to transcribe video: ${videoError.message || 'Unknown error'}` },
              { status: 500 }
            );
          }
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'AI analysis could not extract valid results. Please retry.' },
        { status: 500 }
      );
    }

    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: updateData,
      include: {
        job: { select: { id: true, title: true, publicUrl: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'AI analysis completed successfully!',
      application: {
        id: updatedApplication.id,
        candidateName: updatedApplication.candidateName,
        candidateEmail: updatedApplication.candidateEmail,
        candidatePhone: updatedApplication.candidatePhone,
        resumeUrl: updatedApplication.resumeUrl,
        videoUrl: updatedApplication.videoUrl,
        coverLetter: updatedApplication.coverLetter,
        introTranscript: updatedApplication.introTranscript,
        status: updatedApplication.status,
        matchScore: updatedApplication.matchScore,
        matchedSkills: updatedApplication.matchedSkills,
        missingSkills: updatedApplication.missingSkills,
        aiReasoning: updatedApplication.aiReasoning,
        createdAt: updatedApplication.createdAt.toISOString(),
        job: updatedApplication.job,
      },
    });
  } catch (error: any) {
    console.error('On-demand AI analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during AI analysis.' },
      { status: 500 }
    );
  }
}
