import { prisma } from '../src/lib/prisma';
import { generatePublicUrl, resolveExpiryDate, autoCloseExpiredJobsAllCompanies } from '../src/lib/jobs';

async function runVerification() {
  console.log('=== STARTING VERIFICATION OF MODULES 4.3 & 4.4 ===\n');

  // Find or create test company
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Test Corp',
        email: 'test@corp.com',
        passwordHash: 'dummyhash',
      },
    });
  }

  console.log('1. Testing Public URL Generation...');
  const title = 'Senior Fullstack Software Engineer (AI/ML)';
  const publicUrl = generatePublicUrl(title);
  console.log(`Generated publicUrl slug: "${publicUrl}"`);
  if (!publicUrl.includes('senior-fullstack') || publicUrl.length < 10) {
    throw new Error('Public URL slug generation failed format check');
  }
  console.log('✅ Public URL generation passed.\n');

  console.log('2. Testing Expiry Period Resolution...');
  const expiry7Days = resolveExpiryDate(7);
  const expiry30Days = resolveExpiryDate(30);
  const customDate = resolveExpiryDate(undefined, '2026-12-31');

  console.log('7 days resolved:', expiry7Days?.toISOString());
  console.log('30 days resolved:', expiry30Days?.toISOString());
  console.log('Custom date resolved:', customDate?.toISOString());

  if (!expiry7Days || !expiry30Days || !customDate) {
    throw new Error('Expiry date resolution returned null');
  }
  console.log('✅ Expiry period resolution passed.\n');

  console.log('3. Testing Job Posting Creation (4.3)...');
  const job = await prisma.job.create({
    data: {
      companyId: company.id,
      title: 'Automated Test Engineer',
      description: 'Responsibilities include writing E2E tests, verifying API endpoints, and maintaining test suites.',
      requiredSkills: ['TypeScript', 'Node.js', 'Jest'],
      experienceLevel: 'mid',
      expiryDate: expiry7Days,
      publicUrl,
      status: 'active',
    },
  });
  console.log(`Created Job ID: ${job.id}, Status: ${job.status}, Public URL: ${job.publicUrl}`);
  console.log('✅ Job creation passed.\n');

  console.log('4. Testing Job Posting Edition (4.3)...');
  const updatedJob = await prisma.job.update({
    where: { id: job.id },
    data: {
      title: 'Lead QA & Automated Test Engineer',
      description: 'Updated description with expanded leadership responsibilities.',
      requiredSkills: ['TypeScript', 'Node.js', 'Playwright', 'Jest'],
      experienceLevel: 'lead',
      expiryDate: expiry30Days,
    },
  });
  console.log(`Updated Title: "${updatedJob.title}"`);
  console.log(`Updated Experience Level: "${updatedJob.experienceLevel}"`);
  if (updatedJob.title !== 'Lead QA & Automated Test Engineer' || updatedJob.experienceLevel !== 'lead') {
    throw new Error('Job edition update failed');
  }
  console.log('✅ Job edition passed.\n');

  console.log('5. Testing Manual Job Closure (4.3)...');
  const closedJob = await prisma.job.update({
    where: { id: job.id },
    data: { status: 'closed' },
  });
  console.log(`Job status after manual close: "${closedJob.status}"`);
  if (closedJob.status !== 'closed') {
    throw new Error('Manual job close failed');
  }
  console.log('✅ Manual job closure passed.\n');

  console.log('6. Testing Scheduled Job Expiry & Auto-Close (4.4)...');
  // Create a job with past expiry date
  const pastExpiryDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
  const expiredTestJob = await prisma.job.create({
    data: {
      companyId: company.id,
      title: 'Expired Internship Role',
      description: 'This position was created in the past to test auto-close cron process.',
      requiredSkills: ['HTML', 'CSS'],
      experienceLevel: 'entry',
      expiryDate: pastExpiryDate,
      publicUrl: generatePublicUrl('Expired Internship Role'),
      status: 'active',
    },
  });
  console.log(`Created test job with past expiry date (ID: ${expiredTestJob.id}, initial status: ${expiredTestJob.status})`);

  // Run autoCloseExpiredJobsAllCompanies
  const count = await autoCloseExpiredJobsAllCompanies();
  console.log(`Auto-close cron process ran. Number of jobs updated to expired: ${count}`);

  const refreshedExpiredJob = await prisma.job.findUnique({
    where: { id: expiredTestJob.id },
  });
  console.log(`Job status after auto-close cron: "${refreshedExpiredJob?.status}"`);
  if (refreshedExpiredJob?.status !== 'expired') {
    throw new Error('Scheduled auto-close failed to set status to expired');
  }
  console.log('✅ Scheduled job expiry & auto-close process passed.\n');

  // Clean up test jobs
  await prisma.job.deleteMany({
    where: { id: { in: [job.id, expiredTestJob.id] } },
  });
  console.log('Cleanup completed.');

  console.log('\n🎉 ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
}

runVerification()
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
