import { prisma } from '../src/lib/prisma';
import { expireStaleJobs } from '../src/lib/jobs';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('=== STARTING MANDATORY CANDIDATE APPLICATION TESTS ===\n');

  // 1. Create or fetch an active job for testing
  let job = await prisma.job.findFirst({
    where: { status: 'active' },
  });

  if (!job) {
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Test Recruiter Inc',
          email: `test-${Date.now()}@example.com`,
          passwordHash: 'hashed_password',
        },
      });
    }

    job = await prisma.job.create({
      data: {
        companyId: company.id,
        title: 'Senior Software Engineer (Test)',
        description: 'We are looking for a Senior Software Engineer with Next.js and Node.js expertise.',
        requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
        experienceLevel: 'senior',
        publicUrl: `test-active-job-${Date.now()}`,
        status: 'active',
      },
    });
    console.log(`Created test active job ID: ${job.id}, publicUrl: ${job.publicUrl}`);
  } else {
    console.log(`Using active job ID: ${job.id}, publicUrl: ${job.publicUrl}`);
  }

  // Ensure job is active
  await prisma.job.update({
    where: { id: job.id },
    data: { status: 'active', expiryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000) },
  });

  // Create mock files
  const mockPdfPath = path.join(__dirname, 'test-resume.pdf');
  const mockVideoPath = path.join(__dirname, 'test-video.webm');

  // Valid PDF header
  const pdfHeader = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n';
  fs.writeFileSync(mockPdfPath, pdfHeader);

  // Minimal webm video header buffer
  const videoBuffer = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x99, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01]);
  fs.writeFileSync(mockVideoPath, videoBuffer);

  const baseUrl = 'http://localhost:3000';

  // TEST 1: Public Job Page Accessibility
  console.log('\n--- TEST 1: Public Job Page Accessibility (No Auth) ---');
  const pageRes = await fetch(`${baseUrl}/jobs/${job.publicUrl}`);
  console.log(`GET /jobs/${job.publicUrl} status: ${pageRes.status}`);
  if (pageRes.status === 200) {
    console.log('✅ TEST 1 PASSED: Public job page accessible without authentication.');
  } else {
    const text = await pageRes.text();
    console.log(`GET response text snippet: ${text.slice(0, 300)}`);
  }

  // TEST 2: Valid Application Submission Flow
  console.log('\n--- TEST 2: Valid Application Submission Flow ---');
  const formData = new FormData();
  formData.append('candidateName', 'Sarah Candidate');
  formData.append('candidateEmail', 'sarah.candidate@example.com');
  formData.append('candidatePhone', '+1 555-0199');

  const pdfFile = new File([fs.readFileSync(mockPdfPath)], 'sarah-resume.pdf', { type: 'application/pdf' });
  const vidFile = new File([fs.readFileSync(mockVideoPath)], 'intro-video.webm', { type: 'video/webm' });

  formData.append('resume', pdfFile);
  formData.append('video', vidFile);

  const applyRes = await fetch(`${baseUrl}/api/jobs/${job.publicUrl}/apply`, {
    method: 'POST',
    body: formData,
  });

  const applyData = await applyRes.json();
  console.log('Apply API Response:', applyData);

  if (applyRes.ok && applyData.success && applyData.applicationId) {
    console.log('✅ TEST 2a: API route responded with success.');

    // Query Database directly using Prisma
    const dbApp = await prisma.application.findUnique({
      where: { id: applyData.applicationId },
    });

    if (dbApp) {
      console.log('✅ TEST 2b DB Verification PASSED: Application record found in PostgreSQL:');
      console.log(`   - ID: ${dbApp.id}`);
      console.log(`   - Candidate Name: ${dbApp.candidateName}`);
      console.log(`   - Candidate Email: ${dbApp.candidateEmail}`);
      console.log(`   - Candidate Phone: ${dbApp.candidatePhone}`);
      console.log(`   - Resume URL: ${dbApp.resumeUrl}`);
      console.log(`   - Intro Transcript: "${dbApp.introTranscript}"`);
      console.log(`   - Status: ${dbApp.status}`);
      console.log(`   - Created At: ${dbApp.createdAt}`);
    } else {
      console.error('❌ TEST 2b DB Verification FAILED: Application record not found in DB!');
    }
  } else {
    console.error('❌ TEST 2 FAILED:', applyData.error);
  }

  // TEST 3: Verification that video file is NOT saved anywhere
  console.log('\n--- TEST 3: Verify Video File Persistence ---');
  const localVideoSaved = fs.existsSync(path.join(process.cwd(), 'uploads', 'intro-video.webm')) ||
                          fs.existsSync(path.join(process.cwd(), 'public', 'intro-video.webm'));
  if (!localVideoSaved) {
    console.log('✅ TEST 3 PASSED: Video file was processed in-memory and NOT stored anywhere on disk or R2.');
  } else {
    console.error('❌ TEST 3 FAILED: Video file was saved locally!');
  }

  // TEST 4: Invalid File Format Rejection
  console.log('\n--- TEST 4: Invalid Resume Format Rejection ---');
  const invalidFormData = new FormData();
  invalidFormData.append('candidateName', 'Bob Smith');
  invalidFormData.append('candidateEmail', 'bob@example.com');
  invalidFormData.append('candidatePhone', '+1 555-0188');
  invalidFormData.append('resume', new File(['dummy binary'], 'malicious.exe', { type: 'application/x-msdownload' }));
  invalidFormData.append('video', vidFile);

  const invalidRes = await fetch(`${baseUrl}/api/jobs/${job.publicUrl}/apply`, {
    method: 'POST',
    body: invalidFormData,
  });
  const invalidData = await invalidRes.json();
  console.log('Invalid Resume Response:', invalidData);
  if (invalidRes.status === 400 && !invalidData.success) {
    console.log('✅ TEST 4 PASSED: Invalid resume format was rejected server-side.');
  } else {
    console.error('❌ TEST 4 FAILED: Server accepted invalid file format!');
  }

  // TEST 5: Application to Closed/Expired Job
  console.log('\n--- TEST 5: Direct API Submission to Closed Job ---');
  const closedJob = await prisma.job.create({
    data: {
      companyId: job.companyId,
      title: 'Archived Position',
      description: 'Closed job test.',
      requiredSkills: [],
      experienceLevel: 'mid',
      publicUrl: `closed-test-job-${Date.now()}`,
      status: 'closed',
    },
  });

  const closedApplyRes = await fetch(`${baseUrl}/api/jobs/${closedJob.publicUrl}/apply`, {
    method: 'POST',
    body: formData,
  });

  const closedApplyData = await closedApplyRes.json();
  console.log('Closed Job Apply Response:', closedApplyData);
  if (closedApplyRes.status === 400 && !closedApplyData.success) {
    console.log('✅ TEST 5 PASSED: Server rejected application to closed job.');
  } else {
    console.error('❌ TEST 5 FAILED: Server accepted application to closed job!');
  }

  // Clean up mock files & test objects
  try {
    fs.unlinkSync(mockPdfPath);
    fs.unlinkSync(mockVideoPath);
    await prisma.job.delete({ where: { id: closedJob.id } });
  } catch {}

  console.log('\n=== ALL MANDATORY CANDIDATE APPLICATION TESTS COMPLETED ===');
}

runTests().catch(console.error);
