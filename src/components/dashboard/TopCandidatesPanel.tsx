"use client";

import React from "react";
import type { TopCandidate } from "@/components/dashboard/types";

interface TopCandidatesPanelProps {
  candidates: TopCandidate[];
}

export function TopCandidatesPanel({ candidates }: TopCandidatesPanelProps) {
  return (
    <div className="dashboard-card rounded-2xl p-4 transition-colors duration-300 sm:p-5">
      <h3 className="text-base font-semibold text-[var(--text-primary)]">Top Candidates</h3>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Highest AI match scores</p>
      <ul className="mt-4 space-y-3">
        {candidates.length === 0 ? (
          <li className="py-6 text-center text-sm text-[var(--text-muted)]">
            AI-ranked candidates will appear here.
          </li>
        ) : (
          candidates.map((candidate, index) => (
            <li
              key={candidate.id}
              className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--bg-main)]"
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
              <div className="text-right">
                <p className="text-sm font-bold text-[var(--brand-accent)]">
                  {candidate.matchScore}%
                </p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  {candidate.status}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
