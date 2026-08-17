import { prisma } from '../src/lib/prisma';
import { uploadResumeToR2 } from '../src/lib/r2';
import { transcribeVideoWithGemini } from '../src/lib/transcribe';
import fs from 'fs';
import path from 'path';

async function testDirectHandler() {
  console.log('=== DIRECT HANDLER & FUNCTIONALITY TEST ===\n');

  // 1. Fetch active job
  const job = await prisma.job.findFirst({
    where: { status: 'active' },
  });

  if (!job) {
    console.error('No active job found.');
    return;
  }

  console.log(`Found active job: ${job.title} (${job.publicUrl})`);

  // 2. Mock resume & video buffers
  const resumeBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n');
  const videoBuffer = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x99, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01]);

  // 3. Test R2 upload function
  console.log('\n--- Testing R2 Resume Upload Helper ---');
  let resumeUrl = '';
  try {
    resumeUrl = await uploadResumeToR2(resumeBuffer, 'test-resume.pdf', 'application/pdf');
    console.log('✅ R2 Resume Upload URL:', resumeUrl);
  } catch (err: any) {
    console.error('R2 upload error:', err);
  }

  // 4. Test Gemini transcription function
  console.log('\n--- Testing Gemini Video Transcription Helper ---');
  let introTranscript: string | null = null;
  try {
    introTranscript = await transcribeVideoWithGemini(videoBuffer, 'video/webm');
    console.log('✅ Gemini Intro Transcript:', introTranscript);
  } catch (err: any) {
    console.error('Gemini transcription error:', err);
  }

  // 5. Test Database Insertion
  console.log('\n--- Testing PostgreSQL Application Creation ---');
  try {
    const app = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateName: 'Direct Test Candidate',
        candidateEmail: 'direct.test@example.com',
        candidatePhone: '+1 555-0100',
        resumeUrl: resumeUrl || 'https://r2.test/resumes/mock-resume.pdf',
        introTranscript: introTranscript,
        status: 'applied',
      },
    });

    console.log('✅ Application Created in DB successfully:');
    console.log('   - ID:', app.id);
    console.log('   - Candidate Name:', app.candidateName);
    console.log('   - Candidate Email:', app.candidateEmail);
    console.log('   - Candidate Phone:', app.candidatePhone);
    console.log('   - Resume URL:', app.resumeUrl);
    console.log('   - Intro Transcript:', app.introTranscript);
    console.log('   - Status:', app.status);

    // Clean up test application record
    await prisma.application.delete({ where: { id: app.id } });
    console.log('✅ Cleaned up test application record.');
  } catch (err: any) {
    console.error('DB Application creation failed:', err);
  }
}

testDirectHandler().catch(console.error);
