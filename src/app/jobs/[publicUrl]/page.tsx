import { prisma } from "@/lib/prisma";
import { expireStaleJobs } from "@/lib/jobs";
import { notFound } from "next/navigation";
import { PublicJobView } from "@/components/candidate/PublicJobView";
import { getPlan, type PlanKey } from "@/lib/plans";

interface PublicJobPageProps {
  params: Promise<{ publicUrl: string }>;
}

export default async function PublicJobPage({ params }: PublicJobPageProps) {
  const { publicUrl } = await params;

  const job = await prisma.job.findUnique({
    where: { publicUrl },
    include: {
      company: {
        select: {
          name: true,
          subscription: { select: { plan: true } },
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  // Trigger lazy check to update expired status if expiryDate < now
  await expireStaleJobs(job.companyId);

  const refreshed = await prisma.job.findUnique({
    where: { id: job.id },
    include: {
      company: {
        select: {
          name: true,
          subscription: { select: { plan: true } },
        },
      },
    },
  });

  if (!refreshed) {
    notFound();
  }

  const isExpiredOrClosed =
    refreshed.status !== "active" ||
    (refreshed.expiryDate !== null && new Date(refreshed.expiryDate) < new Date());

  const skills = Array.isArray(refreshed.requiredSkills)
    ? (refreshed.requiredSkills as string[])
    : [];

  const planKey = (refreshed.company.subscription?.plan ?? 'free') as PlanKey;
  const plan = getPlan(planKey);

  return (
    <PublicJobView
      job={{
        id: refreshed.id,
        title: refreshed.title,
        description: refreshed.description,
        experienceLevel: refreshed.experienceLevel,
        publicUrl: refreshed.publicUrl,
        status: refreshed.status,
        company: { name: refreshed.company.name },
        requiredSkills: skills,
        isExpiredOrClosed,
      }}
      companyPlan={planKey}
      hasSecureTest={plan.features.secureTest}
      hasVideoIntro={plan.features.videoIntro}
    />
  );
}
