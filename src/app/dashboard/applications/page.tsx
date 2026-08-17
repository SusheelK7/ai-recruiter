"use client";

import React, { useCallback, useEffect, useState } from "react";

interface Application {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string | null;
  resumeUrl: string;
  introTranscript: string | null;
  status: string;
  matchScore: number | null;
  createdAt: string;
  job: { id: string; title: string; publicUrl: string };
}

const STATUS_OPTIONS = ["applied", "screened", "interviewed", "hired", "rejected"];

const STATUS_STYLES: Record<string, string> = {
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  screened: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  interviewed: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  hired: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  tested: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${
        STATUS_STYLES[status] ?? STATUS_STYLES.applied
      }`}
    >
      {status}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="dashboard-card animate-pulse rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded bg-[var(--border-color)]" />
          <div className="h-3 w-56 rounded bg-[var(--border-color)]" />
        </div>
        <div className="h-6 w-16 rounded-lg bg-[var(--border-color)]" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-[var(--border-color)]" />
        <div className="h-3 w-3/4 rounded bg-[var(--border-color)]" />
      </div>
    </div>
  );
}

export default function ApplicationsReviewPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterJob, setFilterJob] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/applications");
      if (!res.ok) throw new Error("Failed to load applications");
      const data = await res.json();
      setApplications(data.applications);
      setError(null);
    } catch {
      setError("Unable to load applications. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateStatus = async (applicationId: string, newStatus: string) => {
    setUpdatingId(applicationId);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );
    } catch {
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Derived: unique jobs for filter dropdown
  const uniqueJobs = Array.from(
    new Map(applications.map((a) => [a.job.id, a.job])).values()
  );

  // Filtered applications
  const filtered = applications.filter((app) => {
    const matchJob = filterJob === "all" || app.job.id === filterJob;
    const matchStatus = filterStatus === "all" || app.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      app.candidateName.toLowerCase().includes(q) ||
      app.candidateEmail.toLowerCase().includes(q) ||
      app.job.title.toLowerCase().includes(q);
    return matchJob && matchStatus && matchSearch;
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
            Applications
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Review candidate submissions, resumes, and video transcripts.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5">
          <span className="text-xs font-semibold text-[var(--text-muted)]">Total</span>
          <span className="rounded-lg bg-[var(--brand-accent)]/10 px-2 py-0.5 text-xs font-bold text-[var(--brand-accent)]">
            {applications.length}
          </span>
        </div>
      </div>

      {/* Filters Row */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or job…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] py-2.5 pl-9 pr-3 text-sm text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:outline-none transition-colors"
          />
        </div>

        {/* Job Filter */}
        <select
          value={filterJob}
          onChange={(e) => setFilterJob(e.target.value)}
          className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:outline-none"
        >
          <option value="all">All Jobs</option>
          {uniqueJobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:outline-none"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
          <button
            onClick={fetchApplications}
            className="ml-3 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="dashboard-card rounded-2xl p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
            {applications.length === 0 ? "No Applications Yet" : "No Results Found"}
          </h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {applications.length === 0
              ? "Candidates will appear here once they apply to your job postings."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      )}

      {/* Application Cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((app) => {
            const isExpanded = expandedId === app.id;
            const isShowingTranscript = showTranscript === app.id;

            return (
              <div
                key={app.id}
                className="dashboard-card overflow-hidden rounded-2xl transition-all duration-200"
              >
                {/* Card Header */}
                <div
                  className="flex cursor-pointer items-start justify-between gap-4 p-4 hover:bg-[var(--bg-main)]/50 sm:p-5"
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                >
                  {/* Candidate Avatar + Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-accent)]/10 text-sm font-bold text-[var(--brand-accent)] uppercase">
                      {app.candidateName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--text-primary)] truncate">
                        {app.candidateName}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{app.candidateEmail}</p>
                      <p className="mt-0.5 text-xs font-medium text-[var(--brand-accent)] truncate">
                        {app.job.title}
                      </p>
                    </div>
                  </div>

                  {/* Status + Date + Expand */}
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={app.status} />
                    <span className="text-xs text-[var(--text-muted)]">{formatDate(app.createdAt)}</span>
                    <svg
                      className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="animate-fade-slide border-t border-[var(--border-color)] bg-[var(--bg-main)]/30 px-4 py-4 sm:px-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Left: Candidate Details */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                          Candidate Info
                        </h4>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 shrink-0 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                            <span className="text-[var(--text-primary)]">{app.candidateEmail}</span>
                          </div>
                          {app.candidatePhone && (
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 shrink-0 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span className="text-[var(--text-primary)]">{app.candidatePhone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 shrink-0 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[var(--text-muted)]">Applied {formatDate(app.createdAt)}</span>
                          </div>
                        </div>

                        {/* Resume Download */}
                        <div className="pt-1">
                          <a
                            href={app.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/5 px-4 py-2 text-xs font-semibold text-[var(--brand-accent)] transition-all hover:bg-[var(--brand-accent)]/15"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Resume
                          </a>
                        </div>
                      </div>

                      {/* Right: Actions + Transcript */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                          HR Actions
                        </h4>

                        {/* Status Update */}
                        <div>
                          <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                            Update Status
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((s) => (
                              <button
                                key={s}
                                type="button"
                                disabled={updatingId === app.id || app.status === s}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus(app.id, s);
                                }}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all disabled:opacity-50 ${
                                  app.status === s
                                    ? `${STATUS_STYLES[s]} ring-2 ring-offset-1 ring-current`
                                    : "border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]"
                                }`}
                              >
                                {updatingId === app.id && app.status !== s ? "…" : s}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Video Transcript Toggle */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTranscript(isShowingTranscript ? null : app.id);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] transition-all hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            {isShowingTranscript ? "Hide" : "View"} Video Transcript
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Transcript Panel */}
                    {isShowingTranscript && (
                      <div className="mt-4 rounded-xl border border-violet-200/80 bg-violet-50/60 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
                        <div className="mb-2 flex items-center gap-2">
                          <svg className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <h5 className="text-xs font-bold text-violet-700 dark:text-violet-300">
                            AI-Transcribed Video Introduction
                          </h5>
                        </div>
                        {app.introTranscript ? (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-violet-900 dark:text-violet-200">
                            {app.introTranscript}
                          </p>
                        ) : (
                          <p className="text-sm italic text-violet-600/70 dark:text-violet-400/70">
                            No transcript available. The video may have been too short, had no speech, or transcription failed during submission.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
