"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Application {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string | null;
  resumeUrl: string;
  videoUrl?: string | null;
  introTranscript: string | null;
  testScore?: number | null;
  violationLog?: Array<{ type: string; timestamp: string; details?: string }> | null;
  status: string;
  matchScore: number | null;
  matchedSkills: string[] | null;
  missingSkills: string[] | null;
  aiReasoning: string | null;
  createdAt: string;
  job: { id: string; title: string; publicUrl: string };
}

const STATUS_OPTIONS = ["applied", "screened", "tested", "interviewed", "hired", "rejected"];

const STATUS_STYLES: Record<string, string> = {
  test_pending: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/50",
  screened: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/50",
  tested: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800/50",
  interviewed: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800/50",
  hired: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/50",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold capitalize ${
        STATUS_STYLES[status] ?? STATUS_STYLES.applied
      }`}
    >
      {status === "test_pending" ? "Assessment Pending" : status}
    </span>
  );
}

function TestScoreBadge({ score, violations }: { score: number | null | undefined; violations?: any[] | null }) {
  const hasViolations = Array.isArray(violations) && violations.length > 0;

  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
        Test: Pending
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold ${
        score >= 75
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          : score >= 50
          ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300"
          : "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300"
      }`}
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {score}% Test
      {hasViolations && (
        <span className="ml-0.5 rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] text-white" title={`${violations.length} security violation(s) recorded`}>
          ⚠️ {violations.length}
        </span>
      )}
    </span>
  );
}

function MatchScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        Not Analyzed
      </span>
    );
  }

  if (score >= 80) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
        <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        {score}% Match
      </span>
    );
  }

  if (score >= 60) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
        <svg className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {score}% Match
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300">
      <svg className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {score}% Match
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="dashboard-card animate-pulse rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded bg-[var(--border-color)]" />
          <div className="h-3 w-56 rounded bg-[var(--border-color)]" />
        </div>
        <div className="h-6 w-24 rounded-lg bg-[var(--border-color)]" />
      </div>
      <div className="h-3 w-full rounded bg-[var(--border-color)]" />
      <div className="h-3 w-3/4 rounded bg-[var(--border-color)]" />
    </div>
  );
}

function ApplicationsContent() {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("jobId") || "all";

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterJob, setFilterJob] = useState<string>(initialJobId);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"score_desc" | "score_asc" | "date_desc">("score_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analyzingType, setAnalyzingType] = useState<"all" | "resume" | "video" | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<{ applicationId: string; candidateName: string } | null>(null);

  // Sync filterJob if URL param changes
  useEffect(() => {
    const paramJobId = searchParams.get("jobId");
    if (paramJobId) {
      setFilterJob(paramJobId);
    }
  }, [searchParams]);

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

  const handleAnalyze = async (applicationId: string, type: "all" | "resume" | "video" = "all") => {
    setAnalyzingId(applicationId);
    setAnalyzingType(type);
    try {
      const res = await fetch(`/api/applications/${applicationId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to complete AI analysis.");
      }

      // Update state with newly scored data
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, ...data.application } : app))
      );
      setExpandedId(applicationId);
    } catch (err: any) {
      alert(err.message || "AI Analysis failed. Please check your Gemini API key.");
    } finally {
      setAnalyzingId(null);
      setAnalyzingType(null);
    }
  };

  // Derived: unique jobs for filter dropdown
  const uniqueJobs = useMemo(() => {
    return Array.from(new Map(applications.map((a) => [a.job.id, a.job])).values());
  }, [applications]);

  // Derived metrics
  const activeJobTitle = uniqueJobs.find((j) => j.id === filterJob)?.title;
  const scoredCount = applications.filter((a) => a.matchScore !== null).length;
  const avgScore =
    scoredCount > 0
      ? Math.round(
          applications
            .filter((a) => a.matchScore !== null)
            .reduce((sum, a) => sum + (a.matchScore || 0), 0) / scoredCount
        )
      : null;

  // Filtered & Sorted applications
  const filtered = useMemo(() => {
    const result = applications.filter((app) => {
      const matchJob = filterJob === "all" || app.job.id === filterJob;
      const matchStatus = filterStatus === "all" || app.status === filterStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        app.candidateName.toLowerCase().includes(q) ||
        app.candidateEmail.toLowerCase().includes(q) ||
        app.job.title.toLowerCase().includes(q);
      return matchJob && matchStatus && matchSearch;
    });

    return result.sort((a, b) => {
      if (sortBy === "date_desc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      if (sortBy === "score_asc") {
        if (a.matchScore === null && b.matchScore === null) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (a.matchScore === null) return 1;
        if (b.matchScore === null) return -1;
        return a.matchScore - b.matchScore;
      }

      // Default: score_desc (nulls last)
      if (a.matchScore === null && b.matchScore === null) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (a.matchScore === null) return 1;
      if (b.matchScore === null) return -1;
      return b.matchScore - a.matchScore;
    });
  }, [applications, filterJob, filterStatus, searchQuery, sortBy]);

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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
              Candidate Rankings & Applications
            </h1>
            {filterJob !== "all" && activeJobTitle && (
              <span className="hidden sm:inline-flex items-center rounded-lg bg-[var(--brand-accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--brand-accent)]">
                {activeJobTitle}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Instant candidate submissions with on-demand AI resume evaluation and video transcription.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 shadow-sm">
            <span className="text-xs font-medium text-[var(--text-muted)]">Total:</span>
            <span className="text-xs font-bold text-[var(--text-primary)]">{applications.length}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/50 px-3 py-1.5 shadow-sm dark:border-purple-900/40 dark:bg-purple-950/20">
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Screened:</span>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">{scoredCount}/{applications.length}</span>
          </div>
          {avgScore !== null && (
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-1.5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Avg Score:</span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{avgScore}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters & Sorting Bar */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
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
            placeholder="Search by candidate or job…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] py-2.5 pl-9 pr-3 text-sm text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:outline-none transition-colors"
          />
        </div>

        {/* Job Filter */}
        <div>
          <select
            value={filterJob}
            onChange={(e) => setFilterJob(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:outline-none"
          >
            <option value="all">All Jobs ({applications.length})</option>
            {uniqueJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:outline-none"
          >
            <option value="score_desc">Sort: Highest Match Score</option>
            <option value="score_asc">Sort: Lowest Match Score</option>
            <option value="date_desc">Sort: Newest Applied</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
          <button onClick={fetchApplications} className="ml-3 font-semibold underline hover:no-underline">
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
            {applications.length === 0 ? "No Applications Yet" : "No Matching Applications"}
          </h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {applications.length === 0
              ? "Candidates will appear here as soon as they submit their application."
              : "Try adjusting your search query, job selection, or status filters."}
          </p>
        </div>
      )}

      {/* Candidate Application Cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((app, index) => {
            const isExpanded = expandedId === app.id;
            const isShowingTranscript = showTranscript === app.id;
            const isAnalyzingThis = analyzingId === app.id;
            const matchedList = Array.isArray(app.matchedSkills) ? app.matchedSkills : [];
            const missingList = Array.isArray(app.missingSkills) ? app.missingSkills : [];

            return (
              <div
                key={app.id}
                className={`dashboard-card overflow-hidden rounded-2xl transition-all duration-200 border ${
                  isExpanded ? "border-[var(--brand-accent)]/40 shadow-md" : "border-[var(--border-color)]"
                }`}
              >
                {/* Main Card Summary */}
                <div
                  className="flex cursor-pointer flex-col gap-3 p-4 hover:bg-[var(--bg-main)]/50 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                >
                  {/* Left: Rank #, Candidate Info & Job */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-accent)]/10 text-sm font-bold text-[var(--brand-accent)]">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[var(--text-primary)] truncate text-base">
                          {app.candidateName}
                        </span>
                        <StatusBadge status={app.status} />
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                        <span>{app.candidateEmail}</span>
                        {app.candidatePhone && <span>• {app.candidatePhone}</span>}
                        <span>• {formatDate(app.createdAt)}</span>
                      </div>

                      <p className="mt-1 text-xs font-semibold text-[var(--brand-accent)] truncate">
                        Position: {app.job.title}
                      </p>
                    </div>
                  </div>

                  {/* Right: Score Badge & Actions */}
                  <div className="flex shrink-0 items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0">
                    {/* Technical Test Score Badge */}
                    <TestScoreBadge score={app.testScore} violations={app.violationLog} />

                    {/* Instant Action: Quick Analyze Button if not analyzed */}
                    {app.matchScore === null ? (
                      <button
                        type="button"
                        disabled={isAnalyzingThis}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnalyze(app.id, "all");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
                      >
                        {isAnalyzingThis ? (
                          <>
                            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-3.5 w-3.5 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            <span>Analyze with AI</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <MatchScoreBadge score={app.matchScore} />
                    )}

                    <svg
                      className={`h-5 w-5 text-[var(--text-muted)] transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-[var(--brand-accent)]" : ""
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

                {/* Expanded Detailed Breakdown */}
                {isExpanded && (
                  <div className="animate-fade-slide border-t border-[var(--border-color)] bg-[var(--bg-main)]/40 p-4 sm:p-6 space-y-6">
                    {/* AI Scoring Summary Callout */}
                    <div className="rounded-xl border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/5 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <svg className="h-5 w-5 text-[var(--brand-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <h4 className="text-sm font-bold text-[var(--text-primary)]">
                            AI Screening Evaluation ({app.matchScore !== null ? `${app.matchScore}/100 Match Score` : "Pending Analysis"})
                          </h4>
                        </div>

                        {/* On-Demand Analysis Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isAnalyzingThis}
                            onClick={() => handleAnalyze(app.id, "all")}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-accent)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                          >
                            {isAnalyzingThis && analyzingType === "all" ? (
                              <>
                                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                <span>Running AI...</span>
                              </>
                            ) : (
                              <>
                                <span>⚡ {app.matchScore === null ? "Analyze Candidate" : "Re-Analyze (All)"}</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={isAnalyzingThis}
                            onClick={() => handleAnalyze(app.id, "resume")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--brand-accent)] disabled:opacity-50"
                          >
                            {isAnalyzingThis && analyzingType === "resume" ? "Analyzing..." : "📄 Score Resume"}
                          </button>

                          {app.videoUrl && (
                            <button
                              type="button"
                              disabled={isAnalyzingThis}
                              onClick={() => handleAnalyze(app.id, "video")}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:border-violet-400 disabled:opacity-50"
                            >
                              {isAnalyzingThis && analyzingType === "video" ? "Transcribing..." : "🎥 Transcribe Video"}
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-[var(--text-primary)]/90">
                        {app.aiReasoning ||
                          (app.matchScore === null
                            ? "Candidate application was received instantly without delay. Click 'Analyze Candidate' above to generate an AI match score, extracted skills, and video transcript with Google Gemini."
                            : "Candidate match evaluated against target job requirements.")}
                      </p>
                    </div>

                    {/* Matched vs Missing Skills Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Matched Skills */}
                      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                            Matched Skills ({matchedList.length})
                          </h5>
                        </div>
                        {matchedList.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {matchedList.map((skill, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-300/80 bg-emerald-100/70 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/40 dark:text-emerald-200"
                              >
                                ✓ {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs italic text-[var(--text-muted)]">
                            {app.matchScore === null ? "Analyze candidate to extract matched skills." : "No explicit matched skills extracted."}
                          </p>
                        )}
                      </div>

                      {/* Missing / Gap Skills */}
                      <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="h-4 w-4 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <h5 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                            Missing Skills / Gaps ({missingList.length})
                          </h5>
                        </div>
                        {missingList.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {missingList.map((skill, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-300/80 bg-rose-100/70 px-2.5 py-1 text-xs font-semibold text-rose-800 dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200"
                              >
                                − {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs italic text-[var(--text-muted)]">
                            {app.matchScore === null ? "Analyze candidate to identify missing skill gaps." : "No critical missing skills flagged."}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Technical Screening Assessment & Proctoring Summary */}
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/60 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                            AI-Personalized Technical Assessment
                          </h5>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--text-primary)]">
                            Score: {app.testScore !== null && app.testScore !== undefined ? `${app.testScore}/100` : "Pending"}
                          </span>
                          {Array.isArray(app.violationLog) && app.violationLog.length > 0 ? (
                            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                              ⚠️ {app.violationLog.length} Security Incident(s) Logged
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              ✓ Proctored Clean
                            </span>
                          )}
                        </div>
                      </div>

                      {Array.isArray(app.violationLog) && app.violationLog.length > 0 && (
                        <div className="rounded-lg border border-rose-200/80 bg-rose-50/50 p-2.5 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200 space-y-1">
                          <p className="font-semibold">Security Violations Recorded:</p>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                            {app.violationLog.map((v, i) => (
                              <li key={i}>
                                <strong>{v.type}:</strong> {v.details || "Tab switched or window lost focus"} ({new Date(v.timestamp).toLocaleTimeString()})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Candidate Actions & Assets */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                      {/* Left: Resume & Video Assets */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          Candidate Documents & Video
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`/api/applications/${app.id}/resume`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/10 px-4 py-2 text-xs font-semibold text-[var(--brand-accent)] transition-all hover:bg-[var(--brand-accent)]/20"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Resume
                          </a>

                          {app.videoUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveVideoModal({ applicationId: app.id, candidateName: app.candidateName });
                              }}
                              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-2 text-xs font-semibold text-indigo-700 transition-all hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300"
                            >
                              <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                              Watch Video Intro
                            </button>
                          )}

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

                      {/* Right: Recruiter Status Actions */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          Update Pipeline Stage
                        </h5>
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
                    </div>

                    {/* Video Transcript Drawer */}
                    {isShowingTranscript && (
                      <div className="rounded-xl border border-violet-200/80 bg-violet-50/60 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            <h5 className="text-xs font-bold text-violet-700 dark:text-violet-300">
                              Candidate Video Introduction Transcript
                            </h5>
                          </div>

                          {!app.introTranscript && app.videoUrl && (
                            <button
                              type="button"
                              disabled={isAnalyzingThis}
                              onClick={() => handleAnalyze(app.id, "video")}
                              className="text-xs font-semibold text-violet-700 underline hover:no-underline dark:text-violet-300"
                            >
                              {isAnalyzingThis ? "Transcribing..." : "Transcribe Now with Gemini"}
                            </button>
                          )}
                        </div>
                        {app.introTranscript ? (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-violet-900 dark:text-violet-200">
                            {app.introTranscript}
                          </p>
                        ) : (
                          <p className="text-sm italic text-violet-600/70 dark:text-violet-400/70">
                            No transcript generated yet. Click 'Transcribe Now' or 'Analyze Candidate' to transcribe candidate's video with Gemini.
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

      {/* Video Playback Modal */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Video Introduction: {activeVideoModal.candidateName}
              </h3>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-black p-4 flex items-center justify-center min-h-[300px]">
              <video
                src={`/api/applications/${activeVideoModal.applicationId}/video`}
                controls
                autoPlay
                playsInline
                className="max-h-[60vh] w-full rounded-xl"
              />
            </div>

            <div className="flex justify-end p-4 border-t border-[var(--border-color)] bg-[var(--bg-main)]/30">
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-main)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplicationsReviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading applications dashboard...</div>}>
      <ApplicationsContent />
    </Suspense>
  );
}
