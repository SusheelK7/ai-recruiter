"use client";

import React from "react";
import type { UpcomingInterviewItem } from "@/components/dashboard/types";

interface UpcomingInterviewsPanelProps {
  interviews: UpcomingInterviewItem[];
}

function formatScheduledTime(dateString: string | null) {
  if (!dateString) return "No time set";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function UpcomingInterviewsPanel({ interviews }: UpcomingInterviewsPanelProps) {
  return (
    <div className="dashboard-card rounded-2xl p-4 transition-colors duration-300 sm:p-5">
      <h3 className="text-base font-semibold text-[var(--text-primary)]">Upcoming Interviews</h3>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Next scheduled candidate conversations</p>
      <ul className="mt-4 space-y-3">
        {interviews.length === 0 ? (
          <li className="py-6 text-center text-sm text-[var(--text-muted)]">
            No interviews scheduled yet.
          </li>
        ) : (
          interviews.map((interview) => (
            <li
              key={interview.id}
              className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 transition hover:bg-[var(--bg-main)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {interview.candidateName}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{interview.jobTitle}</p>
                </div>
                <span className="rounded-full bg-[#E0E7FF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#3730A3] dark:bg-[#312E81]/20 dark:text-[#E0E7FF]">
                  {interview.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>{formatScheduledTime(interview.scheduledTime)}</span>
                {interview.matchScore !== null && <span>· {interview.matchScore}% match</span>}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
