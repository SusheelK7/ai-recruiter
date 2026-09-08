"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ToastContainer, useToast } from "@/components/ui/Toast";

interface InterviewItem {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string | null;
  jobId: string;
  jobTitle: string;
  matchScore?: number | null;
  testScore?: number | null;
  applicationStatus: string; // "interviewed" | "hired" | "rejected" | ...
  interviewStatus: string;   // "upcoming" | "completed"
  scheduledTime: string | null;
  resumeUrl?: string;
  videoUrl?: string | null;
  createdAt: string;
}

export function InterviewsDashboard() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [upcomingList, setUpcomingList] = useState<InterviewItem[]>([]);
  const [completedList, setCompletedList] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJob, setFilterJob] = useState<string>("all");

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<{ id: string; decision: string } | null>(null);

  const { toasts, addToast, dismissToast } = useToast();

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/interviews");
      if (!res.ok) {
        throw new Error("Failed to load interviews.");
      }
      const data = await res.json();
      setUpcomingList(data.upcoming || []);
      setCompletedList(data.completed || []);
    } catch (err: any) {
      setError(err.message || "Failed to load interviews. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  // Mark interview as completed
  const handleMarkAsCompleted = async (interview: InterviewItem) => {
    // If scheduled time is in the future, prompt for confirmation
    if (interview.scheduledTime) {
      const interviewDate = new Date(interview.scheduledTime);
      if (interviewDate > new Date()) {
        const confirmed = window.confirm(
          `The scheduled interview time (${interviewDate.toLocaleString()}) has not arrived yet. Are you sure you want to mark it as completed now?`
        );
        if (!confirmed) return;
      }
    }

    try {
      setCompletingId(interview.id);
      const res = await fetch(`/api/interviews/${interview.id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to mark interview as completed.");
      }

      // Move from upcoming to completed in local state
      const updatedItem: InterviewItem = {
        ...interview,
        interviewStatus: "completed",
      };

      setUpcomingList((prev) => prev.filter((item) => item.id !== interview.id));
      setCompletedList((prev) => [updatedItem, ...prev]);

      addToast("Interview marked as completed. Awaiting hire/rejection decision.", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to update interview.", "error");
    } finally {
      setCompletingId(null);
    }
  };

  // Post-interview decision (Hire or Not Selected)
  const handleDecision = async (interview: InterviewItem, decision: "hired" | "rejected") => {
    try {
      setDecidingId({ id: interview.id, decision });
      const res = await fetch(`/api/interviews/${interview.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record decision.");
      }

      // Update applicationStatus in completed list
      setCompletedList((prev) =>
        prev.map((item) =>
          item.id === interview.id ? { ...item, applicationStatus: decision } : item
        )
      );

      if (data.emailWarning) {
        addToast(data.emailWarning, "warning");
      } else if (decision === "hired") {
        addToast("Candidate marked as Hired — offer notification email sent!", "success");
      } else {
        addToast("Candidate marked as Not Selected — status update email sent.", "success");
      }
    } catch (err: any) {
      addToast(err.message || "Failed to submit decision.", "error");
    } finally {
      setDecidingId(null);
    }
  };

  // Unique job titles for filter dropdown
  const uniqueJobs = useMemo(() => {
    const all = [...upcomingList, ...completedList];
    const map = new Map<string, string>();
    all.forEach((item) => {
      if (item.jobId && item.jobTitle) {
        map.set(item.jobId, item.jobTitle);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [upcomingList, completedList]);

  // Filtered lists
  const currentList = activeTab === "upcoming" ? upcomingList : completedList;
  const filteredList = useMemo(() => {
    return currentList.filter((item) => {
      const matchJob = filterJob === "all" || item.jobId === filterJob;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.candidateName.toLowerCase().includes(q) ||
        item.candidateEmail.toLowerCase().includes(q) ||
        item.jobTitle.toLowerCase().includes(q);
      return matchJob && matchSearch;
    });
  }, [currentList, filterJob, searchQuery]);

  const pendingDecisionsCount = completedList.filter(
    (item) => item.applicationStatus !== "hired" && item.applicationStatus !== "rejected"
  ).length;

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="px-3 py-4 sm:px-5 sm:py-6 lg:px-8 space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
            Interview Management
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Schedule walk-in interview sessions, track scheduled appointments, and record post-interview hiring decisions.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 shadow-sm">
            <span className="text-xs font-medium text-[var(--text-muted)]">Upcoming:</span>
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{upcomingList.length}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 shadow-sm">
            <span className="text-xs font-medium text-[var(--text-muted)]">Completed:</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{completedList.length}</span>
          </div>
          {pendingDecisionsCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Pending Decision:</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{pendingDecisionsCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Switcher & Filter Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Tabs */}
        <div className="flex items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-1 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "upcoming"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Upcoming Sessions</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeTab === "upcoming" ? "bg-white/20 text-white" : "bg-[var(--border-color)] text-[var(--text-muted)]"
              }`}
            >
              {upcomingList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "completed"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Completed & Decisions</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeTab === "completed" ? "bg-white/20 text-white" : "bg-[var(--border-color)] text-[var(--text-muted)]"
              }`}
            >
              {completedList.length}
            </span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[220px]">
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
              placeholder="Search candidate or job…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] py-2 pl-9 pr-3 text-xs text-[var(--text-primary)] focus:border-violet-500 focus:outline-none transition"
            />
          </div>

          {/* Job Filter */}
          {uniqueJobs.length > 0 && (
            <select
              value={filterJob}
              onChange={(e) => setFilterJob(e.target.value)}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-violet-500 focus:outline-none"
            >
              <option value="all">All Jobs ({uniqueJobs.length})</option>
              {uniqueJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={fetchInterviews}
            className="rounded-xl border border-[var(--border-color)] p-2 text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)] transition"
            title="Refresh interviews"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
          <button onClick={fetchInterviews} className="ml-3 font-semibold underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="dashboard-card animate-pulse rounded-2xl p-5 space-y-3">
              <div className="h-5 w-48 rounded bg-[var(--border-color)]" />
              <div className="h-4 w-64 rounded bg-[var(--border-color)]" />
              <div className="h-3 w-32 rounded bg-[var(--border-color)]" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredList.length === 0 && (
        <div className="dashboard-card rounded-2xl p-10 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {activeTab === "upcoming" ? "No Upcoming Interviews" : "No Completed Interviews"}
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {activeTab === "upcoming"
              ? "When you schedule walk-in interviews from the Candidates page, they will be listed here sorted by date & time."
              : "Completed interviews awaiting hire or rejection decisions will appear here."}
          </p>
        </div>
      )}

      {/* Interview Cards List */}
      {!loading && !error && filteredList.length > 0 && (
        <div className="space-y-3">
          {filteredList.map((item) => {
            const isCompletingThis = completingId === item.id;
            const isDecidingThis = decidingId?.id === item.id;
            const isHired = item.applicationStatus === "hired";
            const isRejected = item.applicationStatus === "rejected";
            const isPendingDecision = !isHired && !isRejected;

            return (
              <div
                key={item.id}
                className="dashboard-card overflow-hidden rounded-2xl border border-[var(--border-color)] p-4 sm:p-5 transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: Candidate Info & Date */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[var(--text-primary)] text-base truncate">
                          {item.candidateName}
                        </span>

                        {activeTab === "completed" && (
                          <>
                            {isHired && (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                                ✓ Hired
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300">
                                ✗ Not Selected
                              </span>
                            )}
                            {isPendingDecision && (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
                                ⏳ Pending Decision
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                        <span>{item.candidateEmail}</span>
                        {item.candidatePhone && <span>• {item.candidatePhone}</span>}
                        {item.matchScore !== null && item.matchScore !== undefined && (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            • {item.matchScore}% Match
                          </span>
                        )}
                        {item.testScore !== null && item.testScore !== undefined && (
                          <span className="font-semibold text-violet-600 dark:text-violet-400">
                            • {item.testScore}% Assessment
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-[var(--brand-accent)]">
                          Role: {item.jobTitle}
                        </span>
                        <span className="text-[var(--text-muted)]">•</span>
                        <span className="inline-flex items-center gap-1 font-medium text-[var(--text-primary)]">
                          📅 {formatDateTime(item.scheduledTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
                    {/* Upcoming Tab: "Mark as Completed" */}
                    {activeTab === "upcoming" && (
                      <button
                        type="button"
                        disabled={isCompletingThis}
                        onClick={() => handleMarkAsCompleted(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 transition"
                      >
                        {isCompletingThis ? (
                          <>
                            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Mark as Completed</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Completed Tab: Decision Actions (Hire / Not Selected) */}
                    {activeTab === "completed" && (
                      <div className="flex items-center gap-2">
                        {isPendingDecision ? (
                          <>
                            <button
                              type="button"
                              disabled={isDecidingThis}
                              onClick={() => handleDecision(item, "hired")}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
                            >
                              {isDecidingThis && decidingId?.decision === "hired" ? (
                                "Saving..."
                              ) : (
                                <>
                                  <span>✓</span>
                                  <span>Hire</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={isDecidingThis}
                              onClick={() => handleDecision(item, "rejected")}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 disabled:opacity-50 transition"
                            >
                              {isDecidingThis && decidingId?.decision === "rejected" ? (
                                "Saving..."
                              ) : (
                                <>
                                  <span>✗</span>
                                  <span>Not Selected</span>
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)] italic">
                            Decision recorded ({item.applicationStatus})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
