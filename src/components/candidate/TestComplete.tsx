"use client";

import React from "react";
import Link from "next/link";

interface TestCompleteProps {
  jobTitle: string;
  companyName: string;
  candidateName: string;
  candidateEmail: string;
}

export function TestComplete({
  jobTitle,
  companyName,
  candidateName,
  candidateEmail,
}: TestCompleteProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-6 text-center shadow-md dark:border-emerald-900/40 dark:bg-emerald-950/20 sm:p-10 max-w-2xl mx-auto space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-100 sm:text-3xl">
          Application Submitted Successfully!
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed sm:text-base">
          Thank you for applying, <strong className="font-semibold text-emerald-950 dark:text-emerald-50">{candidateName}</strong>! Your application and technical screening assessment for{" "}
          <strong className="font-semibold text-emerald-950 dark:text-emerald-50">{jobTitle}</strong> at{" "}
          <strong className="font-semibold text-emerald-950 dark:text-emerald-50">{companyName}</strong> have been finalized.
        </p>
      </div>

      <div className="rounded-xl border border-emerald-200/60 bg-white/60 p-4 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300 sm:text-sm">
        The recruiting team has received your complete profile, resume, video introduction, and assessment. You will be notified via email at <strong className="font-semibold">{candidateEmail}</strong> regarding the next steps in the hiring process.
      </div>

      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-accent)] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[var(--brand-accent-hover)] transition-all"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
