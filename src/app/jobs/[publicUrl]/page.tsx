import { prisma } from "@/lib/prisma";
import { expireStaleJobs } from "@/lib/jobs";
import { notFound } from "next/navigation";
import { PublicJobView } from "@/components/candidate/PublicJobView";

interface PublicJobPageProps {
  params: Promise<{ publicUrl: string }>;
}

export default async function PublicJobPage({ params }: PublicJobPageProps) {
  const { publicUrl } = await params;

  const job = await prisma.job.findUnique({
    where: { publicUrl },
    include: {
      company: { select: { name: true } },
    },
  });

  if (!job) {
    notFound();
  }

  // Trigger lazy check to update expired status if expiryDate < now
  await expireStaleJobs(job.companyId);

  const refreshed = await prisma.job.findUnique({
    where: { id: job.id },
    include: { company: { select: { name: true } } },
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

  return (
    <PublicJobView
      job={{
        id: refreshed.id,
        title: refreshed.title,
        description: refreshed.description,
        experienceLevel: refreshed.experienceLevel,
        publicUrl: refreshed.publicUrl,
        status: refreshed.status,
        company: refreshed.company,
        requiredSkills: skills,
        isExpiredOrClosed,
      }}
    />
  );
}
