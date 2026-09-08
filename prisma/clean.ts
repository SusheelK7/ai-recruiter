import { prisma } from "../src/lib/prisma";

async function cleanDatabase() {
  console.log("Starting database cleanup...");

  // Get counts before deletion
  const countsBefore = {
    activityLogs: await prisma.activityLog.count(),
    candidateTests: await prisma.candidateTest.count(),
    testResults: await prisma.testResult.count(),
    interviews: await prisma.interview.count(),
    tests: await prisma.test.count(),
    applications: await prisma.application.count(),
    jobs: await prisma.job.count(),
    subscriptions: await prisma.subscription.count(),
    users: await prisma.user.count(),
    companies: await prisma.company.count(),
  };

  console.log("Records before cleanup:", countsBefore);

  // Execute clean in order of child-to-parent dependencies
  await prisma.activityLog.deleteMany({});
  await prisma.candidateTest.deleteMany({});
  await prisma.testResult.deleteMany({});
  await prisma.interview.deleteMany({});
  await prisma.test.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.company.deleteMany({});

  const countsAfter = {
    activityLogs: await prisma.activityLog.count(),
    candidateTests: await prisma.candidateTest.count(),
    testResults: await prisma.testResult.count(),
    interviews: await prisma.interview.count(),
    tests: await prisma.test.count(),
    applications: await prisma.application.count(),
    jobs: await prisma.job.count(),
    subscriptions: await prisma.subscription.count(),
    users: await prisma.user.count(),
    companies: await prisma.company.count(),
  };

  console.log("Records after cleanup:", countsAfter);
  console.log("Database cleanup completed successfully!");
}

cleanDatabase()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
