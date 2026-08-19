"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ApplicationForm } from "@/components/candidate/ApplicationForm";

interface JobData {
  id: string;
  title: string;
  description: string;
  experienceLevel: string;
  publicUrl: string;
  status: string;
  company: {
    name: string;
  };
  requiredSkills: string[];
  isExpiredOrClosed: boolean;
}

interface PublicJobViewProps {
  job: JobData;
}

export function PublicJobView({ job }: PublicJobViewProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };
    if (isDrawerOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isDrawerOpen]);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand-accent)] text-xs text-white">
              AI
            </span>
            AI Recruiter
          </Link>
          <span className="rounded-full bg-[var(--brand-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-accent)]">
            {job.company.name}
          </span>
        </div>

        {/* Closed / Expired State Banner */}
        {job.isExpiredOrClosed ? (
          <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/70 p-6 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <span className="inline-flex rounded-lg bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                  {job.status === "closed" ? "Posting Closed" : "Posting Expired"}
                </span>
                <h1 className="text-xl font-bold text-amber-950 dark:text-amber-100 sm:text-2xl">
                  This job posting has closed
                </h1>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Applications for <strong className="font-semibold">{job.title}</strong> at{" "}
                  <strong className="font-semibold">{job.company.name}</strong> are no longer being accepted.
                </p>
              </div>
            </div>

            {/* Inactive details overview */}
            <div className="mt-6 border-t border-amber-200/60 pt-6 dark:border-amber-900/30">
              <h2 className="text-sm font-semibold text-amber-950 dark:text-amber-200">Role Details (Archived)</h2>
              <div className="mt-2 whitespace-pre-wrap text-xs text-amber-900/80 dark:text-amber-300/80 line-clamp-6">
                {job.description}
              </div>
            </div>
          </div>
        ) : (
          /* Active Job Posting Card */
          <div className="dashboard-card rounded-2xl p-6 sm:p-8">
            {/* Job Header with Apply Button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-[var(--border-color)] pb-6">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--brand-accent)] uppercase tracking-wider">
                    {job.company.name}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    Active Hiring
                  </span>
                </div>

                <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl tracking-tight">
                  {job.title}
                </h1>

                <p className="text-xs capitalize text-[var(--text-muted)]">
                  {job.experienceLevel} level position
                </p>
              </div>

              {/* Primary Apply Button near Job Title */}
              <div className="shrink-0 pt-1 sm:pt-0">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-accent)] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[var(--brand-accent-hover)] hover:shadow-xl active:scale-95"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Apply Now
                </button>
              </div>
            </div>

            {/* Job Description */}
            <div className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                Job Description
              </h2>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
                {job.description}
              </div>
            </div>

            {/* Required Skills */}
            {job.requiredSkills.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                  Required Skills & Expertise
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-xl bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/20 px-3 py-1 text-xs font-semibold text-[var(--brand-accent)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Call-to-Action Card */}
            <div className="mt-8 rounded-2xl border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/5 p-6 text-center">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Ready to Join {job.company.name}?</h3>
              <p className="mt-1 text-xs text-[var(--text-muted)] max-w-md mx-auto">
                Submit your profile, attach your resume, and introduce yourself with a short video intro.
              </p>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-accent)] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[var(--brand-accent-hover)] active:scale-95"
              >
                Apply for this Position
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Slide-Over Application Drawer from the Right Side */}
      {/* --------------------------------------------------------------------- */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Right Slide-Over Panel */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-2xl bg-[var(--bg-card)] shadow-2xl overflow-y-auto border-l border-[var(--border-color)] animate-slide-in-right">
              <ApplicationForm
                publicUrl={job.publicUrl}
                jobTitle={job.title}
                companyName={job.company.name}
                onClose={() => setIsDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
