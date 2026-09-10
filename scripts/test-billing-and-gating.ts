import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { generateAuthToken } from "../src/lib/jwt";
import { stripe } from "../src/lib/stripe";
import bcrypt from "bcryptjs";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_webhook_secret_ai_recruiter_2026";

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(name: string, passed: boolean, details?: string) {
  results.push({ name, passed, details });
  const status = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} - ${name}${details ? ` (${details})` : ""}`);
}

async function runTests() {
  console.log("=================================================");
  console.log("  RUNNING SUBSCRIPTION & FEATURE GATING SUITE    ");
  console.log("=================================================");

  const timestamp = Date.now();
  const testEmail = `billing-test-${timestamp}@company.com`;
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Setup Test Company & User with default Free plan
  const company = await prisma.company.create({
    data: {
      name: `Billing Test Corp ${timestamp}`,
      email: testEmail,
      passwordHash,
      plan: "free",
      users: {
        create: {
          email: testEmail,
          passwordHash,
          role: "admin",
        },
      },
      subscription: {
        create: {
          plan: "free",
          status: "active",
          stripeCustomerId: `cus_test_${timestamp}`,
        },
      },
    },
    include: {
      users: true,
      subscription: true,
    },
  });

  const user = company.users[0];
  const authToken = generateAuthToken({
    id: user.id,
    companyId: company.id,
    email: user.email,
  });

  const headers = {
    "Content-Type": "application/json",
    Cookie: `authToken=${authToken}`,
  };

  // Create 1 initial job and 1 test application
  const initialJob = await prisma.job.create({
    data: {
      companyId: company.id,
      title: "Senior Fullstack Engineer",
      description: "Looking for a seasoned TypeScript & React engineer.",
      requiredSkills: ["TypeScript", "React", "Node.js"],
      publicUrl: `job-test-${timestamp}`,
      status: "active",
    },
  });

  const initialApp = await prisma.application.create({
    data: {
      jobId: initialJob.id,
      candidateName: "Jane Doe",
      candidateEmail: "jane.doe@example.com",
      resumeUrl: "resumes/test-resume.pdf",
      videoUrl: "videos/test-intro.webm",
      status: "test_pending",
    },
  });

  try {
    // -------------------------------------------------------------
    // Test 1: GET /api/billing/status on Free Plan
    // -------------------------------------------------------------
    const statusRes = await fetch(`${BASE_URL}/api/billing/status`, { headers });
    const statusData = await statusRes.json();
    record(
      "Free Plan: GET /api/billing/status returns Free tier & locked flags",
      statusRes.status === 200 &&
        statusData.plan === "free" &&
        statusData.features.secureTest === false &&
        statusData.features.videoIntro === false &&
        statusData.features.chatbot === false &&
        statusData.features.fullAnalytics === false &&
        statusData.limits.jobLimit === 1,
      `Plan: ${statusData.plan}, JobLimit: ${statusData.limits?.jobLimit}`
    );

    // -------------------------------------------------------------
    // Test 2: Gated Route - Direct call to Video Transcription (POST /analyze)
    // -------------------------------------------------------------
    const videoTranscribeRes = await fetch(
      `${BASE_URL}/api/applications/${initialApp.id}/analyze`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ type: "video" }),
      }
    );
    const videoTranscribeData = await videoTranscribeRes.json();
    record(
      "Gating: Video transcription route returns 403 on Free plan",
      videoTranscribeRes.status === 403 && videoTranscribeData.upgradeRequired === true,
      `Status: ${videoTranscribeRes.status}, Error: "${videoTranscribeData.error}"`
    );

    // -------------------------------------------------------------
    // Test 3: Gated Route - Direct call to Video Stream (GET /video)
    // -------------------------------------------------------------
    const videoStreamRes = await fetch(
      `${BASE_URL}/api/applications/${initialApp.id}/video`,
      { headers }
    );
    const videoStreamData = await videoStreamRes.json();
    record(
      "Gating: Video playback stream route returns 403 on Free plan",
      videoStreamRes.status === 403 && videoStreamData.upgradeRequired === true,
      `Status: ${videoStreamRes.status}, Error: "${videoStreamData.error}"`
    );

    // -------------------------------------------------------------
    // Test 4: Gated Route - Direct call to Secure Test Creation (POST /generate-test)
    // -------------------------------------------------------------
    const testGenRes = await fetch(
      `${BASE_URL}/api/applications/${initialApp.id}/generate-test`,
      {
        method: "POST",
        headers,
      }
    );
    const testGenData = await testGenRes.json();
    record(
      "Gating: Secure test generation route returns 403 on Free plan",
      testGenRes.status === 403 && testGenData.upgradeRequired === true,
      `Status: ${testGenRes.status}, Error: "${testGenData.error}"`
    );

    // -------------------------------------------------------------
    // Test 5: Gated Route - Direct call to Chatbot (POST /api/chatbot)
    // -------------------------------------------------------------
    const chatbotRes = await fetch(`${BASE_URL}/api/chatbot`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message: "What are great questions for a frontend lead?" }),
    });
    const chatbotData = await chatbotRes.json();
    record(
      "Gating: Chatbot assistant route returns 403 on Free plan",
      chatbotRes.status === 403 && chatbotData.upgradeRequired === true,
      `Status: ${chatbotRes.status}, Error: "${chatbotData.error}"`
    );

    // -------------------------------------------------------------
    // Test 6: Gated Route - Direct call to Full Analytics (GET /api/analytics)
    // -------------------------------------------------------------
    const analyticsRes = await fetch(`${BASE_URL}/api/analytics`, { headers });
    const analyticsData = await analyticsRes.json();
    record(
      "Gating: Full analytics route returns 403 on Free plan",
      analyticsRes.status === 403 && analyticsData.upgradeRequired === true,
      `Status: ${analyticsRes.status}, Error: "${analyticsData.error}"`
    );

    // -------------------------------------------------------------
    // Test 7: Job Limit Check - Attempt to post 2nd job on Free plan (Limit: 1)
    // -------------------------------------------------------------
    const secondJobRes = await fetch(`${BASE_URL}/api/jobs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Product Designer",
        description: "Seeking a designer with Figma & UI experience.",
        requiredSkills: ["Figma", "UI/UX"],
        experienceLevel: "mid",
        expiryDays: 30,
      }),
    });
    const secondJobData = await secondJobRes.json();
    record(
      "Plan Limits: Second job creation rejected with 403 on Free plan (limit 1)",
      secondJobRes.status === 403 && secondJobData.upgradeRequired === true,
      `Status: ${secondJobRes.status}, Message: "${secondJobData.error}"`
    );

    // -------------------------------------------------------------
    // Test 8: Stripe Checkout Session Initiation (POST /api/billing/checkout)
    // -------------------------------------------------------------
    const checkoutRes = await fetch(`${BASE_URL}/api/billing/checkout`, {
      method: "POST",
      headers,
      body: JSON.stringify({ plan: "pro" }),
    });
    const checkoutData = await checkoutRes.json();
    record(
      "Stripe Checkout: POST /api/billing/checkout generates session URL",
      checkoutRes.status === 200 && (typeof checkoutData.url === "string" || typeof checkoutData.sessionId === "string"),
      `Status: ${checkoutRes.status}, Session: ${checkoutData.sessionId || "Created"}`
    );

    // -------------------------------------------------------------
    // Test 9: Stripe Webhook - checkout.session.completed
    // -------------------------------------------------------------
    const mockSubscriptionId = `sub_test_${timestamp}`;
    const checkoutCompletedPayload = {
      id: `evt_test_checkout_${timestamp}`,
      object: "event",
      api_version: "2025-02-24.acacia",
      created: Math.floor(Date.now() / 1000),
      type: "checkout.session.completed",
      data: {
        object: {
          id: `cs_test_${timestamp}`,
          object: "checkout.session",
          client_reference_id: company.id,
          customer: company.subscription?.stripeCustomerId,
          subscription: mockSubscriptionId,
          metadata: {
            companyId: company.id,
            plan: "pro",
          },
        },
      },
    };

    const webhookBody = JSON.stringify(checkoutCompletedPayload);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload: webhookBody,
      secret: WEBHOOK_SECRET,
    });

    const webhookRes = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature,
      },
      body: webhookBody,
    });
    const webhookData = await webhookRes.json();

    // Re-query database to verify Subscription.plan and Company.plan updated
    const updatedCompany = await prisma.company.findUnique({
      where: { id: company.id },
      include: { subscription: true },
    });

    record(
      "Stripe Webhook: checkout.session.completed upgrades DB Subscription & Company to 'pro'",
      webhookRes.status === 200 &&
        webhookData.received === true &&
        updatedCompany?.plan === "pro" &&
        updatedCompany?.subscription?.plan === "pro" &&
        updatedCompany?.subscription?.status === "active",
      `Company plan: ${updatedCompany?.plan}, Subscription plan: ${updatedCompany?.subscription?.plan}`
    );

    // -------------------------------------------------------------
    // Test 10: Pro Plan Unlocked Verification
    // -------------------------------------------------------------
    const proStatusRes = await fetch(`${BASE_URL}/api/billing/status`, { headers });
    const proStatusData = await proStatusRes.json();
    record(
      "Pro Plan: GET /api/billing/status reflects unlocked features & higher limits",
      proStatusRes.status === 200 &&
        proStatusData.plan === "pro" &&
        proStatusData.features.secureTest === true &&
        proStatusData.features.videoIntro === true &&
        proStatusData.features.chatbot === true &&
        proStatusData.features.fullAnalytics === true &&
        proStatusData.limits.jobLimit === 10,
      `Plan: ${proStatusData.plan}, Features: ${JSON.stringify(proStatusData.features)}`
    );

    // Test Chatbot now works on Pro
    const proChatbotRes = await fetch(`${BASE_URL}/api/chatbot`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message: "Provide 2 behavioral questions for an engineer." }),
    });
    const proChatbotData = await proChatbotRes.json();
    record(
      "Pro Plan: Chatbot assistant route now succeeds (200)",
      proChatbotRes.status === 200 && typeof proChatbotData.reply === "string",
      `Status: ${proChatbotRes.status}, Reply length: ${proChatbotData.reply?.length} chars`
    );

    // Test Full Analytics now works on Pro
    const proAnalyticsRes = await fetch(`${BASE_URL}/api/analytics`, { headers });
    const proAnalyticsData = await proAnalyticsRes.json();
    record(
      "Pro Plan: Full analytics route now succeeds (200)",
      proAnalyticsRes.status === 200 && Array.isArray(proAnalyticsData.conversionFunnel),
      `Status: ${proAnalyticsRes.status}, Funnel stages: ${proAnalyticsData.conversionFunnel?.length}`
    );

    // Test 2nd Job posting now succeeds on Pro (limit 10)
    const proJobRes = await fetch(`${BASE_URL}/api/jobs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Product Designer",
        description: "Seeking a designer with Figma & UI experience.",
        requiredSkills: ["Figma", "UI/UX"],
        experienceLevel: "mid",
        expiryDays: 30,
      }),
    });
    const proJobData = await proJobRes.json();
    record(
      "Pro Plan: Second job posting successfully created (up to 10 allowed)",
      (proJobRes.status === 200 || proJobRes.status === 201) && !!proJobData.job?.id,
      `Status: ${proJobRes.status}, JobId: ${proJobData.job?.id}`
    );

    // -------------------------------------------------------------
    // Test 11: Stripe Webhook - customer.subscription.deleted (Cancellation)
    // -------------------------------------------------------------
    const subscriptionDeletedPayload = {
      id: `evt_test_delete_${timestamp}`,
      object: "event",
      api_version: "2025-02-24.acacia",
      created: Math.floor(Date.now() / 1000),
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: mockSubscriptionId,
          object: "subscription",
          customer: company.subscription?.stripeCustomerId,
          status: "canceled",
        },
      },
    };

    const deleteWebhookBody = JSON.stringify(subscriptionDeletedPayload);
    const deleteSignature = stripe.webhooks.generateTestHeaderString({
      payload: deleteWebhookBody,
      secret: WEBHOOK_SECRET,
    });

    const deleteWebhookRes = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": deleteSignature,
      },
      body: deleteWebhookBody,
    });

    const canceledCompany = await prisma.company.findUnique({
      where: { id: company.id },
      include: { subscription: true },
    });

    record(
      "Stripe Webhook: customer.subscription.deleted downgrades plan to 'free'",
      deleteWebhookRes.status === 200 &&
        canceledCompany?.plan === "free" &&
        canceledCompany?.subscription?.plan === "free" &&
        canceledCompany?.subscription?.status === "canceled",
      `Company plan: ${canceledCompany?.plan}, Status: ${canceledCompany?.subscription?.status}`
    );

    // Verify Chatbot is locked again after cancellation
    const relockedChatbotRes = await fetch(`${BASE_URL}/api/chatbot`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message: "Are features locked again?" }),
    });
    record(
      "Re-Locking: Gated features are strictly locked again (403) after subscription cancellation",
      relockedChatbotRes.status === 403,
      `Status: ${relockedChatbotRes.status}`
    );

    // -------------------------------------------------------------
    // Test 12: Stripe Webhook - invoice.payment_failed (Grace Period)
    // -------------------------------------------------------------
    const paymentFailedPayload = {
      id: `evt_test_failed_${timestamp}`,
      object: "event",
      api_version: "2025-02-24.acacia",
      created: Math.floor(Date.now() / 1000),
      type: "invoice.payment_failed",
      data: {
        object: {
          id: `in_test_${timestamp}`,
          object: "invoice",
          customer: company.subscription?.stripeCustomerId,
          subscription: mockSubscriptionId,
        },
      },
    };

    const failWebhookBody = JSON.stringify(paymentFailedPayload);
    const failSignature = stripe.webhooks.generateTestHeaderString({
      payload: failWebhookBody,
      secret: WEBHOOK_SECRET,
    });

    const failWebhookRes = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": failSignature,
      },
      body: failWebhookBody,
    });

    const flaggedCompany = await prisma.company.findUnique({
      where: { id: company.id },
      include: { subscription: true },
    });

    record(
      "Grace Period: invoice.payment_failed flags subscription status as 'payment_issue'",
      failWebhookRes.status === 200 &&
        flaggedCompany?.subscription?.status === "payment_issue",
      `Subscription status: ${flaggedCompany?.subscription?.status}`
    );
  } finally {
    // Clean up test data
    console.log("\nCleaning up test records...");
    await prisma.application.deleteMany({ where: { job: { companyId: company.id } } });
    await prisma.job.deleteMany({ where: { companyId: company.id } });
    await prisma.subscription.deleteMany({ where: { companyId: company.id } });
    await prisma.user.deleteMany({ where: { companyId: company.id } });
    await prisma.company.deleteMany({ where: { id: company.id } });
    console.log("Cleanup finished.");
  }

  // Final Summary
  console.log("\n=================================================");
  console.log("             TEST EXECUTION SUMMARY              ");
  console.log("=================================================");
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length}`);
  console.log(`PASSED:      ${passedCount}`);
  console.log(`FAILED:      ${failedCount}`);
  console.log("=================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered an unhandled error:", err);
  process.exit(1);
});
