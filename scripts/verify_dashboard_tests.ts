import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import {
  expireStaleJobs,
  generatePublicUrl,
  resolveExpiryDate,
  daysUntilExpiry,
} from '../src/lib/jobs';
import { createJobSchema } from '../src/lib/validations/job';

async function cleanCompany(email: string) {
  const company = await prisma.company.findUnique({ where: { email } });
  if (company) {
    await prisma.job.deleteMany({ where: { companyId: company.id } });
    await prisma.user.deleteMany({ where: { companyId: company.id } });
    await prisma.company.delete({ where: { id: company.id } });
  }
}

async function createTestCompany(name: string, email: string) {
  const passwordHash = await bcrypt.hash('TestPass123!', 12);
  return prisma.company.create({
    data: {
      name,
      email,
      passwordHash,
      emailVerified: true,
      users: {
        create: {
          email,
          passwordHash,
          role: 'admin',
          emailVerified: true,
        },
      },
    },
  });
}

async function runDashboardTests() {
  console.log('====================================================');
  console.log('STARTING DASHBOARD TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;

  const emailA = 'dashboard_test_a@example.com';
  const emailB = 'dashboard_test_b@example.com';
  await cleanCompany(emailA);
  await cleanCompany(emailB);

  const companyA = await createTestCompany('Company Alpha', emailA);
  const companyB = await createTestCompany('Company Beta', emailB);

  // TEST 1: Job creation saves to DB with required fields
  console.log('--- TEST 1: Job Creation & DB Persistence ---');
  const publicUrl = generatePublicUrl('Senior React Developer');
  const expiryDate = resolveExpiryDate(15);

  const jobA = await prisma.job.create({
    data: {
      companyId: companyA.id,
      title: 'Senior React Developer',
      description: 'Build modern web applications with React and TypeScript for our growing team.',
      requiredSkills: ['React', 'TypeScript', 'Node.js'],
      experienceLevel: 'senior',
      expiryDate,
      publicUrl,
      status: 'active',
    },
  });

  const dbJob = await prisma.job.findUnique({ where: { id: jobA.id } });
  if (
    dbJob &&
    dbJob.companyId === companyA.id &&
    dbJob.publicUrl === publicUrl &&
    dbJob.status === 'active' &&
    dbJob.experienceLevel === 'senior'
  ) {
    console.log('✓ TEST 1 PASSED: Job saved in database with publicUrl, companyId, and metadata.');
    passed += 1;
  } else {
    throw new Error('TEST 1 FAILED: Job not persisted correctly.');
  }
  console.log('');

  // TEST 2: Zod validation rejects invalid job data
  console.log('--- TEST 2: Zod Validation ---');
  const invalid = createJobSchema.safeParse({
    title: 'AB',
    description: 'Too short',
    requiredSkills: [],
    experienceLevel: 'mid',
  });

  if (!invalid.success) {
    console.log('✓ TEST 2 PASSED: Invalid job payload rejected by Zod schema.');
    passed += 1;
  } else {
    throw new Error('TEST 2 FAILED: Invalid payload was accepted.');
  }
  console.log('');

  // TEST 3: Company isolation — Company B cannot see Company A jobs
  console.log('--- TEST 3: Company Isolation ---');
  const jobB = await prisma.job.create({
    data: {
      companyId: companyB.id,
      title: 'Backend Engineer',
      description: 'Build scalable APIs and services for our platform infrastructure team.',
      requiredSkills: ['Go', 'PostgreSQL'],
      experienceLevel: 'mid',
      expiryDate: resolveExpiryDate(30),
      publicUrl: generatePublicUrl('Backend Engineer'),
      status: 'active',
    },
  });

  const companyAJobs = await prisma.job.findMany({ where: { companyId: companyA.id } });
  const companyBJobs = await prisma.job.findMany({ where: { companyId: companyB.id } });
  const aHasB = companyAJobs.some((job) => job.id === jobB.id);
  const bHasA = companyBJobs.some((job) => job.id === jobA.id);

  if (companyAJobs.length === 1 && companyBJobs.length === 1 && !aHasB && !bHasA) {
    console.log('✓ TEST 3 PASSED: Jobs are scoped to their respective companies.');
    passed += 1;
  } else {
    throw new Error('TEST 3 FAILED: Cross-company job leakage detected.');
  }
  console.log('');

  // TEST 4: Auto-expire stale jobs on read
  console.log('--- TEST 4: Auto-Expire Stale Jobs ---');
  const expiredJob = await prisma.job.create({
    data: {
      companyId: companyA.id,
      title: 'Expired Role',
      description: 'This job posting has already passed its expiry date and should be closed.',
      requiredSkills: ['Testing'],
      experienceLevel: 'entry',
      expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      publicUrl: generatePublicUrl('Expired Role'),
      status: 'active',
    },
  });

  await expireStaleJobs(companyA.id);
  const expiredDbJob = await prisma.job.findUnique({ where: { id: expiredJob.id } });

  if (expiredDbJob?.status === 'expired') {
    console.log('✓ TEST 4 PASSED: Expired job automatically marked as expired on read.');
    passed += 1;
  } else {
    throw new Error('TEST 4 FAILED: Stale job was not auto-expired.');
  }
  console.log('');

  // TEST 5: Public URL uniqueness
  console.log('--- TEST 5: Unique Public URL ---');
  const url1 = generatePublicUrl('Product Designer');
  const url2 = generatePublicUrl('Product Designer');

  if (url1 !== url2) {
    console.log('✓ TEST 5 PASSED: Generated public URLs are unique.');
    passed += 1;
  } else {
    throw new Error('TEST 5 FAILED: Public URLs are not unique.');
  }
  console.log('');

  // TEST 6: Days until expiry calculation
  console.log('--- TEST 6: Expiry Days Calculation ---');
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const days = daysUntilExpiry(futureDate);

  if (days !== null && days >= 6 && days <= 8) {
    console.log(`✓ TEST 6 PASSED: daysUntilExpiry returned ${days} for a ~7-day future date.`);
    passed += 1;
  } else {
    throw new Error(`TEST 6 FAILED: Unexpected daysUntilExpiry value: ${days}`);
  }
  console.log('');

  // Cleanup
  await cleanCompany(emailA);
  await cleanCompany(emailB);

  console.log('====================================================');
  console.log(`ALL ${passed}/6 DASHBOARD TESTS PASSED WITH DIRECT DB VERIFICATION!`);
  console.log('====================================================');
}

runDashboardTests().catch((error) => {
  console.error('FATAL TEST ERROR:', error);
  process.exit(1);
});
