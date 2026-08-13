"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { StatCard } from "@/components/dashboard/StatCard";
import { ApplicationsChart } from "@/components/dashboard/ApplicationsChart";
import { HiringFunnelChart } from "@/components/dashboard/HiringFunnelChart";
import { JobPostingsTable } from "@/components/dashboard/JobPostingsTable";
import { UpcomingInterviewsPanel } from "@/components/dashboard/UpcomingInterviewsPanel";
import { TopCandidatesPanel } from "@/components/dashboard/TopCandidatesPanel";
import { PostJobModal } from "@/components/dashboard/PostJobModal";
import { EditJobModal } from "@/components/dashboard/EditJobModal";
import { MobileMenuButton } from "@/components/dashboard/MobileMenuButton";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import type { CreatedJob, DashboardData, JobPosting } from "@/components/dashboard/types";

function daysUntilExpiryFromIso(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const diffMs = new Date(expiryDate).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function CompanyDashboard() {
  const { setCompanyName } = useDashboard();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [newJobId, setNewJobId] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        throw new Error("Failed to load dashboard");
      }
      const json = (await res.json()) as DashboardData;
      setData(json);
      setCompanyName(json.company.name);
      setError(null);
    } catch {
      setError("Unable to load dashboard data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [setCompanyName]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleJobCreated = (job: CreatedJob) => {
    setData((prev) => {
      if (!prev) return prev;

      const newPosting = {
        id: job.id,
        title: job.title,
        status: job.status,
        applicationsCount: job.applicationsCount,
        daysUntilExpiry: daysUntilExpiryFromIso(job.expiryDate),
        publicUrl: job.publicUrl,
        createdAt: job.createdAt,
      };

      return {
        ...prev,
        stats: {
          ...prev.stats,
          activeJobs: prev.stats.activeJobs + 1,
          trends: {
            ...prev.stats.trends,
            activeJobs: prev.stats.trends.activeJobs + 1,
          },
        },
        jobPostings: [newPosting, ...prev.jobPostings],
      };
    });

    setNewJobId(job.id);
    setTimeout(() => setNewJobId(null), 2000);
  };

  const handleJobUpdated = (updatedJob: JobPosting) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        jobPostings: prev.jobPostings.map((j) => (j.id === updatedJob.id ? updatedJob : j)),
      };
    });
  };

  const handleCloseJob = async (jobId: string) => {
    const res = await fetch(`/api/jobs/${jobId}/close`, {
      method: "POST",
    });

    if (res.ok) {
      setData((prev) => {
        if (!prev) return prev;
        const wasActive = prev.jobPostings.find((j) => j.id === jobId)?.status === "active";
        return {
          ...prev,
          stats: {
            ...prev.stats,
            activeJobs: wasActive ? Math.max(0, prev.stats.activeJobs - 1) : prev.stats.activeJobs,
          },
          jobPostings: prev.jobPostings.map((j) =>
            j.id === jobId ? { ...j, status: "closed" } : j
          ),
        };
      });
    } else {
      const errData = await res.json();
      alert(errData.error || "Failed to close job posting");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-accent)] border-t-transparent" />
          <p className="text-sm text-[var(--text-muted)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="dashboard-card max-w-md rounded-2xl p-6 text-center">
          <p className="text-[var(--text-primary)]">{error ?? "Something went wrong."}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchDashboard();
            }}
            className="mt-4 rounded-xl bg-[var(--brand-accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      <ScrollReveal durationMs={400} distancePx={16}>
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-start md:justify-between lg:items-center">
          <div className="flex items-start gap-3">
            <MobileMenuButton />
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
                Welcome, {data.company.name}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)] sm:text-base">
                Here&apos;s what&apos;s happening with your hiring pipeline today.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--brand-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--brand-accent-hover)] active:scale-[0.98] md:w-auto"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Post a New Job
          </button>
        </header>
      </ScrollReveal>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <ScrollReveal staggerIndex={0} durationMs={400} distancePx={16}>
          <StatCard
            title="Active Jobs"
            value={data.stats.activeJobs}
            trend={data.stats.trends.activeJobs}
            icon={
              <svg className="h-5 w-5 text-[#2E5B8A] dark:text-[#4A7FC1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            accentClass="bg-[#2E5B8A]/10 dark:bg-[#4A7FC1]/15"
          />
        </ScrollReveal>
        <ScrollReveal staggerIndex={1} durationMs={400} distancePx={16}>
          <StatCard
            title="Total Applications"
            value={data.stats.totalApplications}
            trend={data.stats.trends.totalApplications}
            icon={
              <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            accentClass="bg-emerald-500/10 dark:bg-emerald-500/15"
          />
        </ScrollReveal>
        <ScrollReveal staggerIndex={2} durationMs={400} distancePx={16}>
          <StatCard
            title="Hired This Month"
            value={data.stats.hiredThisMonth}
            trend={data.stats.trends.hiredThisMonth}
            icon={
              <svg className="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            }
            accentClass="bg-violet-500/10 dark:bg-violet-500/15"
          />
        </ScrollReveal>
        <ScrollReveal staggerIndex={3} durationMs={400} distancePx={16}>
          <StatCard
            title="Interview Scheduled"
            value={data.stats.interviewsScheduled}
            trend={data.stats.trends.interviewsScheduled}
            icon={
              <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            accentClass="bg-amber-500/10 dark:bg-amber-500/15"
          />
        </ScrollReveal>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:gap-4 xl:grid-cols-2">
        <ScrollReveal staggerIndex={0} durationMs={400} distancePx={16}>
          <ApplicationsChart data={data.applicationsOverTime} />
        </ScrollReveal>
        <ScrollReveal staggerIndex={1} durationMs={400} distancePx={16}>
          <HiringFunnelChart data={data.hiringFunnel} />
        </ScrollReveal>
      </div>

      <ScrollReveal durationMs={400} distancePx={16}>
        <div className="mb-6 sm:mb-8">
          <JobPostingsTable
            jobs={data.jobPostings}
            newJobId={newJobId}
            onEditJob={(job) => setEditingJob(job)}
            onCloseJob={handleCloseJob}
          />
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
        <ScrollReveal staggerIndex={0} durationMs={400} distancePx={16}>
          <UpcomingInterviewsPanel interviews={data.upcomingInterviews} />
        </ScrollReveal>
        <ScrollReveal staggerIndex={1} durationMs={400} distancePx={16}>
          <TopCandidatesPanel candidates={data.topCandidates} />
        </ScrollReveal>
      </div>

      <PostJobModal open={modalOpen} onClose={() => setModalOpen(false)} onJobCreated={handleJobCreated} />
      
      <EditJobModal
        open={!!editingJob}
        job={editingJob}
        onClose={() => setEditingJob(null)}
        onJobUpdated={handleJobUpdated}
      />
    </div>
  );
}

