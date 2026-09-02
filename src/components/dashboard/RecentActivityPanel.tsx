"use client";

import React from "react";
import type { RecentActivityItem } from "@/components/dashboard/types";

interface RecentActivityPanelProps {
  activities?: RecentActivityItem[];
}

const STAGE_BADGE_STYLES: Record<string, string> = {
  test_pending: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/50",
  screened: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/50",
  tested: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800/50",
  interviewed: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800/50",
  hired: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/50",
};

function formatTimeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

function StageBadge({ stage }: { stage: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold capitalize ${
        STAGE_BADGE_STYLES[stage] ?? STAGE_BADGE_STYLES.applied
      }`}
    >
      {stage === "test_pending" ? "Assessment Pending" : stage}
    </span>
  );
}

export function RecentActivityPanel({ activities = [] }: RecentActivityPanelProps) {
  return (
    <div className="dashboard-card rounded-2xl p-4 transition-colors duration-300 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Recent Pipeline Activity</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Real-time candidate stage movements & notifications</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {activities.length === 0 ? (
          <li className="py-6 text-center text-sm text-[var(--text-muted)]">
            No pipeline activity logged yet. Candidate stage updates will appear here in real time.
          </li>
        ) : (
          activities.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/50 p-3.5 transition hover:bg-[var(--bg-main)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--text-primary)] text-sm truncate">
                    {item.candidateName}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{item.jobTitle}</p>
                </div>
                <span className="shrink-0 text-[11px] text-[var(--text-muted)] font-medium">
                  {formatTimeAgo(item.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <span className="text-[11px] font-medium text-[var(--text-muted)]">Moved from</span>
                <StageBadge stage={item.previousStage} />
                <svg className="h-3 w-3 shrink-0 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <StageBadge stage={item.newStage} />
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
