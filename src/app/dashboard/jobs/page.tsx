"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PostJobModal } from "@/components/dashboard/PostJobModal";
import { EditJobModal } from "@/components/dashboard/EditJobModal";
import type { CreatedJob, JobPosting } from "@/components/dashboard/types";

function daysUntilExpiryFromIso(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const diffMs = new Date(expiryDate).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  expired: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  closed: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
};

function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-xl border border-[var(--border-color)] p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-48 rounded bg-[var(--border-color)]" />
          <div className="h-3 w-32 rounded bg-[var(--border-color)]" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-14 rounded-lg bg-[var(--border-color)]" />
          <div className="h-6 w-14 rounded-lg bg-[var(--border-color)]" />
        </div>
      </div>
    </div>
  );
}

export default function JobsManagementPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [newJobId, setNewJobId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load jobs");
      const data = await res.json();
      setJobs(data.jobPostings);
      setError(null);
    } catch {
      setError("Unable to load jobs. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleJobCreated = (job: CreatedJob) => {
    const newPosting: JobPosting = {
      id: job.id,
      title: job.title,
      status: job.status,
      applicationsCount: job.applicationsCount,
      daysUntilExpiry: daysUntilExpiryFromIso(job.expiryDate),
      publicUrl: job.publicUrl,
      createdAt: job.createdAt,
    };
    setJobs((prev) => [newPosting, ...prev]);
    setNewJobId(job.id);
    setTimeout(() => setNewJobId(null), 2000);
  };

  const handleJobUpdated = (updatedJob: JobPosting) => {
    setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
  };

  const handleCloseJob = async (job: JobPosting) => {
    if (!confirm(`Close "${job.title}"? Candidates will no longer be able to apply.`)) return;
    setClosingId(job.id);
    try {
      const res = await fetch(`/api/jobs/${job.id}/close`, { method: "POST" });
      if (res.ok) {
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "closed" } : j)));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to close job");
      }
    } finally {
      setClosingId(null);
    }
  };

  const filtered = jobs.filter((job) => {
    const matchStatus = filterStatus === "all" || job.status === filterStatus;
    const matchSearch =
      !searchQuery || job.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
            Jobs
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Create, manage, and close your open positions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPostModalOpen(true)}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--brand-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--brand-accent-hover)] active:scale-[0.98] sm:w-auto"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Post New Job
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search job title…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] py-2.5 pl-9 pr-3 text-sm text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:outline-none transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}{" "}
          <button onClick={fetchJobs} className="underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Skeleton Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="dashboard-card rounded-2xl p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
            {jobs.length === 0 ? "No Jobs Yet" : "No Results Found"}
          </h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {jobs.length === 0
              ? "Post your first role to start receiving applications."
              : "Try a different search or status filter."}
          </p>
          {jobs.length === 0 && (
            <button
              type="button"
              onClick={() => setPostModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-accent-hover)] transition-colors"
            >
              Post Your First Job
            </button>
          )}
        </div>
      )}

      {/* Jobs Table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="dashboard-card overflow-hidden rounded-2xl">
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Applications</th>
                  <th className="px-5 py-3 font-semibold">Expires</th>
                  <th className="px-5 py-3 font-semibold">Posted</th>
                  <th className="px-5 py-3 font-semibold">Public Link</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr
                    key={job.id}
                    className={`border-b border-[var(--border-color)] last:border-0 transition-colors hover:bg-[var(--bg-main)]/50 ${newJobId === job.id ? "bg-[var(--brand-accent)]/5" : ""
                      }`}
                  >
                    <td className="px-5 py-4 font-medium text-[var(--text-primary)]">{job.title}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[job.status] ?? STATUS_STYLES.expired}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.applicationsCount}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[var(--text-muted)]">
                      {job.daysUntilExpiry === null
                        ? "—"
                        : job.daysUntilExpiry <= 0
                          ? "Expired"
                          : `${job.daysUntilExpiry}d`}
                    </td>
                    <td className="px-5 py-4 text-[var(--text-muted)]">{formatDate(job.createdAt)}</td>
                    <td className="px-5 py-4">
                      <CopyLinkButton publicUrl={job.publicUrl} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingJob(job)}
                          className="rounded-lg border border-[var(--border-color)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]"
                        >
                          Edit
                        </button>
                        {job.status === "active" && (
                          <button
                            type="button"
                            disabled={closingId === job.id}
                            onClick={() => handleCloseJob(job)}
                            className="rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 disabled:opacity-50"
                          >
                            {closingId === job.id ? "Closing…" : "Close"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 p-4 md:hidden">
            {filtered.map((job) => (
              <div
                key={job.id}
                className={`rounded-xl border border-[var(--border-color)] p-4 ${newJobId === job.id ? "bg-[var(--brand-accent)]/5" : "bg-[var(--bg-main)]/30"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--text-primary)] truncate">{job.title}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {job.applicationsCount} application{job.applicationsCount === 1 ? "" : "s"} ·{" "}
                      {job.daysUntilExpiry === null ? "No expiry" : job.daysUntilExpiry <= 0 ? "Expired" : `Expires in ${job.daysUntilExpiry}d`}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Posted {formatDate(job.createdAt)}</p>
                  </div>
                  <span className={`inline-flex shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[job.status] ?? STATUS_STYLES.expired}`}>
                    {job.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border-color)]/60 pt-3">
                  <CopyLinkButton publicUrl={job.publicUrl} />
                  <button
                    type="button"
                    onClick={() => setEditingJob(job)}
                    className="rounded-lg border border-[var(--border-color)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)] transition-colors"
                  >
                    Edit
                  </button>
                  {job.status === "active" && (
                    <button
                      type="button"
                      disabled={closingId === job.id}
                      onClick={() => handleCloseJob(job)}
                      className="rounded-lg border border-rose-200 bg-rose-50/50 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 transition-colors disabled:opacity-50"
                    >
                      {closingId === job.id ? "Closing…" : "Close Job"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <PostJobModal open={postModalOpen} onClose={() => setPostModalOpen(false)} onJobCreated={handleJobCreated} />
      <EditJobModal
        open={!!editingJob}
        job={editingJob}
        onClose={() => setEditingJob(null)}
        onJobUpdated={handleJobUpdated}
      />
    </div>
  );
}

// Copy Link Button component
function CopyLinkButton({ publicUrl }: { publicUrl: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/jobs/${publicUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy public application link"
      className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-color)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]"
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-500">Copied!</span>
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Link</span>
        </>
      )}
    </button>
  );
}
