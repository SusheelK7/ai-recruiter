import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { generatePlatformAdminToken, generateAuthToken } from '../src/lib/jwt';
import { canPostJob, canRunAiScan, canUseFeature } from '../src/lib/enforcePlanLimit';
import { getPlatformAiMetrics, AI_UNIT_COSTS } from '../src/lib/ai-costs';

dotenv.config();

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🤖 RUNNING MANDATORY PLATFORM ADMIN VERIFICATION SUITE');
  console.log('======================================================\n');

  // SETUP: Create or get platform admin
  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'admin@airecruiter.io';
  const admin = await prisma.platformAdmin.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    throw new Error('Platform admin not found! Run seed script first.');
  }

  // SETUP: Create a dedicated test company
  const testCompanyEmail = `test-tenant-${Date.now()}@example.com`;
  const passwordHash = await bcrypt.hash('TestCompanyPassword123!', 10);
  const testCompany = await prisma.company.create({
    data: {
      name: 'Verification Test Corp',
      email: testCompanyEmail,
      passwordHash,
      plan: 'free',
      status: 'active',
      emailVerified: true,
      profileCompleted: true,
      users: {
        create: {
          email: testCompanyEmail,
          passwordHash,
          role: 'Admin',
          emailVerified: true,
        },
      },
      subscription: {
        create: {
          plan: 'free',
          status: 'active',
        },
      },
    },
    include: { users: true, subscription: true },
  });

  const testUser = testCompany.users[0];

  console.log(`[Setup] Created test company: ${testCompany.name} (id: ${testCompany.id})`);
  console.log(`[Setup] Platform Admin: ${admin.email} (id: ${admin.id})\n`);

  // Tokens
  const platformAdminToken = generatePlatformAdminToken({ id: admin.id, email: admin.email });
  const companyAuthToken = generateAuthToken({
    id: testUser.id,
    companyId: testCompany.id,
    email: testCompany.email,
  });

  // --------------------------------------------------------------------------
  // TEST A: Log in as platform admin -> confirm access; confirm company authToken alone cannot access
  // --------------------------------------------------------------------------
  console.log('--- TEST A: Platform Admin Login & Token Isolation ---');
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3005';

  try {
    // 1. Check overview API with platformAdminToken
    const adminRes = await fetch(`${baseUrl}/api/platform-admin/overview`, {
      headers: { cookie: `platformAdminToken=${platformAdminToken}` },
    });
    assert(adminRes.status === 200, 'Platform admin token accesses /api/platform-admin/overview (200 OK)');
    const overviewJson = await adminRes.json();
    assert(overviewJson.metrics && typeof overviewJson.metrics.mrr === 'number', 'Overview returns valid metrics structure');

    // 2. Check overview API with company authToken alone
    const companyRes = await fetch(`${baseUrl}/api/platform-admin/overview`, {
      headers: { cookie: `authToken=${companyAuthToken}` },
    });
    assert(companyRes.status === 401, 'Company authToken is strictly rejected on /api/platform-admin/overview (401 Unauthorized)');
  } catch (err: any) {
    console.error('Fetch error during Test A:', err.message);
    assert(false, 'Test A API calls succeeded', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST B: Log in as company Admin -> confirm platform-admin routes reject access
  // --------------------------------------------------------------------------
  console.log('\n--- TEST B: Company Admin Cannot Access Platform Admin Routes ---');
  try {
    const endpoints = [
      '/api/platform-admin/overview',
      '/api/platform-admin/companies',
      '/api/platform-admin/billing',
      '/api/platform-admin/ai-usage',
      '/api/platform-admin/audit-log',
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep}`, {
        headers: { cookie: `authToken=${companyAuthToken}` },
      });
      assert(res.status === 401, `Company authToken rejected on ${ep} (401 Unauthorized)`);
    }
  } catch (err: any) {
    assert(false, 'Test B endpoints tested', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST C: Suspend a company -> confirm users cannot log in, and action appears in audit log
  // --------------------------------------------------------------------------
  console.log('\n--- TEST C: Suspend Company Enforcement & Audit Logging ---');
  try {
    // Call PATCH /api/platform-admin/companies/[id] with action: suspend
    const suspendRes = await fetch(`${baseUrl}/api/platform-admin/companies/${testCompany.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: `platformAdminToken=${platformAdminToken}`,
      },
      body: JSON.stringify({
        action: 'suspend',
        reason: 'Automated test suspension for verification',
      }),
    });
    assert(suspendRes.status === 200, 'Suspend API returned 200 OK');

    // Verify DB status
    const dbCompanySuspended = await prisma.company.findUnique({ where: { id: testCompany.id } });
    assert(dbCompanySuspended?.status === 'suspended', 'Company status in database updated to "suspended"');

    // Verify audit log entry
    const auditLogEntry = await prisma.platformAuditLog.findFirst({
      where: { targetCompanyId: testCompany.id, action: 'suspend_company' },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!auditLogEntry, 'Audit log entry created for suspend_company action');
    assert(
      auditLogEntry?.reason === 'Automated test suspension for verification',
      'Audit log recorded exact justification reason'
    );

    // Attempt company login via /api/auth/login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCompanyEmail,
        password: 'TestCompanyPassword123!',
      }),
    });
    assert(loginRes.status === 403, 'Suspended company login is rejected with HTTP 403 Forbidden');
    const loginJson = await loginRes.json();
    assert(loginJson.suspended === true, 'Login response flags account as suspended');
  } catch (err: any) {
    assert(false, 'Test C execution', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST D: Reinstate the company -> confirm access is restored
  // --------------------------------------------------------------------------
  console.log('\n--- TEST D: Reinstate Company Access ---');
  try {
    const reinstateRes = await fetch(`${baseUrl}/api/platform-admin/companies/${testCompany.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: `platformAdminToken=${platformAdminToken}`,
      },
      body: JSON.stringify({
        action: 'reinstate',
        reason: 'Automated test reinstatement',
      }),
    });
    assert(reinstateRes.status === 200, 'Reinstate API returned 200 OK');

    // Verify DB status
    const dbCompanyActive = await prisma.company.findUnique({ where: { id: testCompany.id } });
    assert(dbCompanyActive?.status === 'active', 'Company status in database restored to "active"');

    // Verify audit log entry
    const reinstateAudit = await prisma.platformAuditLog.findFirst({
      where: { targetCompanyId: testCompany.id, action: 'reinstate_company' },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!reinstateAudit, 'Audit log entry created for reinstate_company action');

    // Attempt company login again
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCompanyEmail,
        password: 'TestCompanyPassword123!',
      }),
    });
    assert(loginRes.status === 200, 'Reinstated company login succeeds with 200 OK');
  } catch (err: any) {
    assert(false, 'Test D execution', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST E: Manually change a company plan -> Subscription updates, audit logged, feature gating reflects immediately
  // --------------------------------------------------------------------------
  console.log('\n--- TEST E: Manual Plan Adjustment & Immediate Gating Reflection ---');
  try {
    // Initial state: Free plan -> videoIntro is disabled
    const preGate = await canUseFeature(testCompany.id, 'videoIntro');
    assert(preGate.allowed === false, 'Free plan initially disallows videoIntro feature');

    // Change plan to Business via Platform Admin API
    const changePlanRes = await fetch(`${baseUrl}/api/platform-admin/companies/${testCompany.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: `platformAdminToken=${platformAdminToken}`,
      },
      body: JSON.stringify({
        action: 'change_plan',
        plan: 'business',
        reason: 'Enterprise pilot contract approval',
      }),
    });
    assert(changePlanRes.status === 200, 'Manual plan change API returned 200 OK');

    // Verify Subscription record
    const updatedSub = await prisma.subscription.findUnique({ where: { companyId: testCompany.id } });
    assert(updatedSub?.plan === 'business', 'Subscription record in database updated to "business"');

    const updatedCompany = await prisma.company.findUnique({ where: { id: testCompany.id } });
    assert(updatedCompany?.plan === 'business', 'Company record in database updated to "business"');

    // Verify audit log
    const planAudit = await prisma.platformAuditLog.findFirst({
      where: { targetCompanyId: testCompany.id, action: 'manual_plan_change' },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!planAudit, 'Audit log entry created for manual_plan_change');
    assert(
      planAudit?.reason?.includes('Enterprise pilot contract approval') ?? false,
      'Audit log recorded the justification reason'
    );

    // Verify immediate feature gating reflection (without touching Stripe)
    const postGateVideo = await canUseFeature(testCompany.id, 'videoIntro');
    assert(postGateVideo.allowed === true, 'Business plan immediately unlocks videoIntro feature');

    const postGateTest = await canUseFeature(testCompany.id, 'secureTest');
    assert(postGateTest.allowed === true, 'Business plan immediately unlocks secureTest feature');

    const postGateJob = await canPostJob(testCompany.id);
    assert(postGateJob.limit === Infinity, 'Business plan immediately grants unlimited job postings');
  } catch (err: any) {
    assert(false, 'Test E execution', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST F: Confirm MRR and AI cost figures match manual calculation against database records
  // --------------------------------------------------------------------------
  console.log('\n--- TEST F: MRR & AI Cost Calculation Spot-Check Against DB ---');
  try {
    // 1. Calculate actual MRR directly from Subscription table
    const subs = await prisma.subscription.findMany({ select: { plan: true } });
    let manualMrr = 0;
    for (const s of subs) {
      if (s.plan === 'pro') manualMrr += 79;
      if (s.plan === 'business') manualMrr += 249;
    }

    const billingRes = await fetch(`${baseUrl}/api/platform-admin/billing`, {
      headers: { cookie: `platformAdminToken=${platformAdminToken}` },
    });
    const billingJson = await billingRes.json();
    assert(
      billingJson.totalMrr === manualMrr,
      `Calculated MRR ($${billingJson.totalMrr}) matches DB Subscription records spot-check ($${manualMrr})`
    );

    // 2. AI cost spot check
    const aiMetrics = await getPlatformAiMetrics();
    const aiRes = await fetch(`${baseUrl}/api/platform-admin/ai-usage`, {
      headers: { cookie: `platformAdminToken=${platformAdminToken}` },
    });
    const aiJson = await aiRes.json();
    assert(
      aiJson.metrics.totalCostThisMonth === aiMetrics.totalCostThisMonth,
      `Platform AI Cost ($${aiJson.metrics.totalCostThisMonth}) exactly matches service computation ($${aiMetrics.totalCostThisMonth})`
    );
  } catch (err: any) {
    assert(false, 'Test F execution', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST G: Confirm companies list correctly paginates and filters
  // --------------------------------------------------------------------------
  console.log('\n--- TEST G: Companies List Search, Filtering, and Pagination ---');
  try {
    // 1. Search by name
    const searchRes = await fetch(
      `${baseUrl}/api/platform-admin/companies?search=${encodeURIComponent('Verification Test Corp')}`,
      { headers: { cookie: `platformAdminToken=${platformAdminToken}` } }
    );
    const searchJson = await searchRes.json();
    assert(
      searchJson.companies.some((c: any) => c.id === testCompany.id),
      'Search by company name returns target company'
    );

    // 2. Filter by plan
    const planRes = await fetch(`${baseUrl}/api/platform-admin/companies?plan=business`, {
      headers: { cookie: `platformAdminToken=${platformAdminToken}` },
    });
    const planJson = await planRes.json();
    assert(
      planJson.companies.every((c: any) => c.plan === 'business'),
      'Filter by plan=business returns exclusively business tier companies'
    );

    // 3. Pagination limits
    const pageRes = await fetch(`${baseUrl}/api/platform-admin/companies?limit=2&page=1`, {
      headers: { cookie: `platformAdminToken=${platformAdminToken}` },
    });
    const pageJson = await pageRes.json();
    assert(pageJson.companies.length <= 2, 'Limit parameter restricts returned results count');
    assert(pageJson.pagination.limit === 2, 'Pagination metadata correctly returns limit');
  } catch (err: any) {
    assert(false, 'Test G execution', err.message);
  }

  // CLEANUP
  console.log('\n[Cleanup] Cleaning up test data...');
  try {
    await prisma.platformAuditLog.deleteMany({ where: { targetCompanyId: testCompany.id } });
    await prisma.subscription.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.user.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.company.delete({ where: { id: testCompany.id } });
    console.log('[Cleanup] Test company and associated records purged successfully.');
  } catch (cleanupErr: any) {
    console.warn('[Cleanup Warning]:', cleanupErr.message);
  }

  console.log('\n======================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error('Fatal testing failure:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
