"use client";

import React, { useState } from "react";

interface TestDisclaimerProps {
  jobTitle: string;
  companyName: string;
  candidateName: string;
  onStartTest: () => void;
  onCancel?: () => void;
}

export function TestDisclaimer({
  jobTitle,
  companyName,
  candidateName,
  onStartTest,
  onCancel,
}: TestDisclaimerProps) {
  const [agreed, setAgreed] = useState(false);
  const [isRequestingFullscreen, setIsRequestingFullscreen] = useState(false);

  const handleStart = async () => {
    if (!agreed) return;

    setIsRequestingFullscreen(true);
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Fullscreen request rejected or ignored:", err);
        });
      }
    } catch (err) {
      console.warn("Fullscreen error:", err);
    } finally {
      setIsRequestingFullscreen(false);
      onStartTest();
    }
  };

  return (
    <div className="rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-sm">
            2
          </span>
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Assessment Instructions & Rules</h3>
            <p className="text-xs text-[var(--text-muted)] sm:text-sm">
              {jobTitle} • {companyName}
            </p>
          </div>
        </div>
      </div>

      {/* Candidate Notice */}
      <div className="rounded-xl border border-blue-200/70 bg-blue-50/60 p-4 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200 sm:text-sm">
        Welcome, <strong className="font-semibold text-blue-950 dark:text-blue-100">{candidateName}</strong>! Your resume and introduction have been saved. Before your application is finalized, you are required to complete a short technical screening test.
      </div>

      {/* Test Specifications Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-3 text-center">
          <p className="text-xs text-[var(--text-muted)] font-medium">Duration</p>
          <p className="text-base font-bold text-[var(--text-primary)] mt-0.5">20 Minutes</p>
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-3 text-center">
          <p className="text-xs text-[var(--text-muted)] font-medium">Format</p>
          <p className="text-base font-bold text-[var(--text-primary)] mt-0.5">8–10 MCQs</p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-3 text-center">
          <p className="text-xs text-[var(--text-muted)] font-medium">Targeting</p>
          <p className="text-base font-bold text-[var(--brand-accent)] mt-0.5">AI-Personalized</p>
        </div>
      </div>

      {/* Security & Integrity Rules */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Security & Proctoring Guidelines
        </h4>

        <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] sm:text-sm">
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs mt-0.5">
              ✕
            </span>
            <span>
              <strong>Fullscreen Mode Required:</strong> This test must be taken in fullscreen mode. Exiting fullscreen will be logged as a violation.
            </span>
          </li>

          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs mt-0.5">
              ✕
            </span>
            <span>
              <strong>No Tab Switching:</strong> Switching browser tabs or blurring the assessment window will be tracked. The 1st violation triggers a warning; a 2nd violation automatically submits the test immediately.
            </span>
          </li>

          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs mt-0.5">
              ℹ
            </span>
            <span>
              <strong>Copy/Paste Disabled:</strong> Copying questions or pasting external text is disabled during the assessment.
            </span>
          </li>

          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs mt-0.5">
              ℹ
            </span>
            <span>
              <strong>Confidential Scoring:</strong> Your score is shared directly with the hiring team and will not be displayed to you upon submission.
            </span>
          </li>
        </ul>
      </div>

      {/* Agreement Checkbox */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-4 w-4 mt-0.5 rounded border-[var(--border-color)] text-[var(--brand-accent)] focus:ring-[var(--brand-accent)] cursor-pointer"
          />
          <span className="text-xs font-medium text-[var(--text-primary)] sm:text-sm">
            I understand and agree to these terms, and I am ready to begin the assessment in fullscreen mode.
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← Back to Job Details
          </button>
        )}

        <button
          type="button"
          disabled={!agreed || isRequestingFullscreen}
          onClick={handleStart}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-accent)] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-[var(--brand-accent-hover)] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ml-auto w-full sm:w-auto"
        >
          {isRequestingFullscreen ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Entering Fullscreen...</span>
            </>
          ) : (
            <>
              <span>Start Assessment</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
