"use client";

import React, { useState } from "react";
import type { JobPosting } from "@/components/dashboard/types";

interface JobPostingsTableProps {
  jobs: JobPosting[];
  newJobId?: string | null;
  onEditJob?: (job: JobPosting) => void;
  onCloseJob?: (jobId: string) => void;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    expired: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    closed: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
    draft: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  };

  return (
    <span
      className={`inline-flex rounded-xl px-2.5 py-1 text-xs font-semibold capitalize ${
        styles[status] ?? styles.draft
      }`}
    >
      {status}
    </span>
  );
}

function ExpiryText({ daysUntilExpiry }: { daysUntilExpiry: number | null }) {
  if (daysUntilExpiry === null) return <>—</>;
  if (daysUntilExpiry <= 0) return <>Expired</>;
  return (
    <>
      {daysUntilExpiry} day{daysUntilExpiry === 1 ? "" : "s"}
    </>
  );
}

function CopyLinkButton({ publicUrl }: { publicUrl: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const fullLink = `${window.location.origin}/jobs/${publicUrl}`;
    try {
      await navigator.clipboard.writeText(fullLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
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

export function JobPostingsTable({ jobs, newJobId, onEditJob, onCloseJob }: JobPostingsTableProps) {
  const [closingId, setClosingId] = useState<string | null>(null);

  const handleClose = async (job: JobPosting) => {
    if (!confirm(`Are you sure you want to close "${job.title}"? Candidates will no longer be able to apply.`)) {
      return;
    }
    setClosingId(job.id);
    try {
      if (onCloseJob) {
        await onCloseJob(job.id);
      }
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div className="dashboard-card overflow-hidden rounded-2xl transition-colors duration-300">
      <div className="border-b border-[var(--border-color)] px-4 py-4 sm:px-5">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Job Postings</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Manage, edit, and close your open roles</p>
      </div>

      {jobs.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-[var(--text-muted)] sm:px-5">
          No job postings yet. Post your first role to get started.
        </div>
      ) : (
        <>
          {/* Mobile view */}
          <div className="space-y-3 p-4 md:hidden">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`rounded-xl border border-[var(--border-color)] p-4 ${
                  newJobId === job.id ? "animate-row-fade-in bg-[var(--brand-accent)]/5" : "bg-[var(--bg-main)]/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)]">{job.title}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {job.applicationsCount} application{job.applicationsCount === 1 ? "" : "s"} · Expires in{" "}
                      <ExpiryText daysUntilExpiry={job.daysUntilExpiry} />
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border-color)]/60">
                  <CopyLinkButton publicUrl={job.publicUrl} />

                  {onEditJob && (
                    <button
                      type="button"
                      onClick={() => onEditJob(job)}
                      className="rounded-lg border border-[var(--border-color)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)] transition-colors"
                    >
                      Edit
                    </button>
                  )}

                  {job.status === "active" && onCloseJob && (
                    <button
                      type="button"
                      disabled={closingId === job.id}
                      onClick={() => handleClose(job)}
                      className="rounded-lg border border-rose-200 bg-rose-50/50 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60 transition-colors disabled:opacity-50"
                    >
                      {closingId === job.id ? "Closing..." : "Close Job"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop view */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Applications</th>
                  <th className="px-5 py-3 font-semibold">Expires In</th>
                  <th className="px-5 py-3 font-semibold">Public Link</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className={`border-b border-[var(--border-color)] last:border-0 transition-colors hover:bg-[var(--bg-main)]/50 ${
                      newJobId === job.id ? "animate-row-fade-in bg-[var(--brand-accent)]/5" : ""
                    }`}
                  >
                    <td className="px-5 py-4 font-medium text-[var(--text-primary)]">{job.title}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-5 py-4 text-[var(--text-muted)]">{job.applicationsCount}</td>
                    <td className="px-5 py-4 text-[var(--text-muted)]">
                      <ExpiryText daysUntilExpiry={job.daysUntilExpiry} />
                    </td>
                    <td className="px-5 py-4">
                      <CopyLinkButton publicUrl={job.publicUrl} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        {onEditJob && (
                          <button
                            type="button"
                            onClick={() => onEditJob(job)}
                            className="rounded-lg border border-[var(--border-color)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]"
                          >
                            Edit
                          </button>
                        )}
                        {job.status === "active" && onCloseJob && (
                          <button
                            type="button"
                            disabled={closingId === job.id}
                            onClick={() => handleClose(job)}
                            className="rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60 disabled:opacity-50"
                          >
                            {closingId === job.id ? "Closing..." : "Close"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
