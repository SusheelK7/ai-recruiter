import { prisma } from "@/lib/prisma";
import { expireStaleJobs } from "@/lib/jobs";
import { notFound } from "next/navigation";
import Link from "next/link";

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
    <div className="min-h-screen bg-[var(--bg-main)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand-accent)] text-xs text-white">
              AI
            </span>
            AI Recruiter
          </Link>
          <span className="rounded-full bg-[var(--brand-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-accent)]">
            {refreshed.company.name}
          </span>
        </div>

        {/* Closed State Banner */}
        {isExpiredOrClosed ? (
          <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/70 p-6 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-1">
                <span className="inline-flex rounded-lg bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                  {refreshed.status === "closed" ? "Posting Closed" : "Posting Expired"}
                </span>
                <h1 className="text-xl font-bold text-amber-950 dark:text-amber-100 sm:text-2xl">
                  This job posting has closed
                </h1>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Applications for <strong className="font-semibold">{refreshed.title}</strong> at{" "}
                  <strong className="font-semibold">{refreshed.company.name}</strong> are no longer being accepted.
                </p>
              </div>
            </div>

            {/* Inactive details overview */}
            <div className="mt-6 border-t border-amber-200/60 pt-6 dark:border-amber-900/30">
              <h2 className="text-sm font-semibold text-amber-950 dark:text-amber-200">Role Details (Archived)</h2>
              <div className="mt-2 whitespace-pre-wrap text-xs text-amber-900/80 dark:text-amber-300/80 line-clamp-6">
                {refreshed.description}
              </div>
            </div>
          </div>
        ) : (
          /* Active Job Posting */
          <div className="dashboard-card rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--brand-accent)]">{refreshed.company.name}</p>
                <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">{refreshed.title}</h1>
                <p className="mt-1 text-sm capitalize text-[var(--text-muted)]">
                  {refreshed.experienceLevel} level position
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                Active Hiring
              </span>
            </div>

            <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
              {refreshed.description}
            </div>

            {skills.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Required Skills</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-xl bg-[var(--brand-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-accent)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/50 p-4 sm:p-6">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Apply for this position</h3>
              <p className="mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
                Submit your application details below to be evaluated by {refreshed.company.name}&apos;s recruiting team.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="rounded-xl bg-[var(--brand-accent)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--brand-accent-hover)]"
                >
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
