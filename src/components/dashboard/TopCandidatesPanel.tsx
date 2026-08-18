"use client";

import React from "react";
import Link from "next/link";
import type { TopCandidate } from "@/components/dashboard/types";

interface TopCandidatesPanelProps {
  candidates: TopCandidate[];
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-[var(--text-muted)]">Pending</span>;

  if (score >= 80) {
    return (
      <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        {score}%
      </span>
    );
  }
  if (score >= 60) {
    return (
      <span className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        {score}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
      {score}%
    </span>
  );
}

export function TopCandidatesPanel({ candidates }: TopCandidatesPanelProps) {
  return (
    <div className="dashboard-card rounded-2xl p-4 transition-colors duration-300 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Top Candidates</h3>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Highest AI scores for active jobs</p>
        </div>
        <Link
          href="/dashboard/applications"
          className="text-xs font-semibold text-[var(--brand-accent)] hover:underline"
        >
          View All
        </Link>
      </div>

      <ul className="mt-4 space-y-2.5">
        {candidates.length === 0 ? (
          <li className="py-6 text-center text-sm text-[var(--text-muted)]">
            Top candidates for active positions will appear here.
          </li>
        ) : (
          candidates.map((candidate, index) => (
            <li key={candidate.id}>
              <Link
                href="/dashboard/applications"
                className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[var(--bg-main)]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-accent)]/12 text-xs font-bold text-[var(--brand-accent)]">
                  #{index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {candidate.name}
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">{candidate.jobTitle}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-0.5">
                  <ScoreBadge score={candidate.matchScore} />
                  <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                    {candidate.status}
                  </span>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
