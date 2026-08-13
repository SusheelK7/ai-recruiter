import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateAuthToken } from '../src/lib/jwt';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function cleanCompany(email: string) {
  const company = await prisma.company.findUnique({ where: { email } });
  if (company) {
    await prisma.job.deleteMany({ where: { companyId: company.id } });
    await prisma.user.deleteMany({ where: { companyId: company.id } });
    await prisma.company.delete({ where: { id: company.id } });
  }
}

async function runApiIntegrationTest() {
  console.log('--- API Integration: Create Job & Dashboard Update ---');

  const email = 'dashboard_api_test@example.com';
  await cleanCompany(email);

  const passwordHash = await bcrypt.hash('TestPass123!', 12);
  const company = await prisma.company.create({
    data: {
      name: 'API Test Co',
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
    include: { users: true },
  });

  const token = generateAuthToken({
    id: company.users[0].id,
    companyId: company.id,
    email: company.email,
  });

  const jobPayload = {
    title: 'Full Stack Engineer',
    description:
      'We are looking for a talented full stack engineer to join our team and build scalable web applications.',
    requiredSkills: ['React', 'Node.js', 'PostgreSQL'],
    experienceLevel: 'mid',
    expiryDays: 15,
  };

  const createRes = await fetch(`${BASE_URL}/api/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `authToken=${token}`,
    },
    body: JSON.stringify(jobPayload),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Create job API failed (${createRes.status}): ${err}`);
  }

  const createData = (await createRes.json()) as { job: { id: string; publicUrl: string } };
  const dbJob = await prisma.job.findUnique({ where: { id: createData.job.id } });

  if (!dbJob || dbJob.companyId !== company.id) {
    throw new Error('Job not found in database after API creation.');
  }

  console.log(`[DB Check] Job "${dbJob.title}" saved with publicUrl: ${dbJob.publicUrl}`);

  const dashboardRes = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: { Cookie: `authToken=${token}` },
  });

  if (!dashboardRes.ok) {
    throw new Error(`Dashboard API failed (${dashboardRes.status})`);
  }

  const dashboard = (await dashboardRes.json()) as {
    stats: { activeJobs: number };
    jobPostings: Array<{ id: string; title: string }>;
  };

  const foundInDashboard = dashboard.jobPostings.some((job) => job.id === createData.job.id);

  if (dashboard.stats.activeJobs >= 1 && foundInDashboard) {
    console.log('✓ API Integration PASSED: Job created via API, verified in DB, and returned by dashboard API.');
  } else {
    throw new Error('Dashboard API did not include the newly created job.');
  }

  await cleanCompany(email);
}

runApiIntegrationTest().catch((error) => {
  console.error('API Integration FAILED:', error.message);
  process.exit(1);
});
