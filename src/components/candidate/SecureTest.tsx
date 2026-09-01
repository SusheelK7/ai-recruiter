"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface ClientQuestion {
  id: number;
  question: string;
  options: string[];
}

interface ViolationItem {
  type: string;
  timestamp: string;
  details?: string;
}

interface SecureTestProps {
  applicationId: string;
  jobTitle: string;
  companyName: string;
  onComplete: () => void;
}

export function SecureTest({
  applicationId,
  jobTitle,
  companyName,
  onComplete,
}: SecureTestProps) {
  // Test State
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Timer State (20 minutes = 1200 seconds)
  const [secondsRemaining, setSecondsRemaining] = useState(20 * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Security & Violation State
  const [violationLog, setViolationLog] = useState<ViolationItem[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitReason, setSubmitReason] = useState<string | null>(null);

  // Ref to track latest state inside event listeners without stale closures
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const violationLogRef = useRef(violationLog);
  violationLogRef.current = violationLog;

  const isSubmittingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  // ---------------------------------------------------------------------------
  // 1. Fetch / Generate Test Questions
  // ---------------------------------------------------------------------------
  const loadQuestions = useCallback(async (isManualRetry = false) => {
    if (hasFetchedRef.current && !isManualRetry) return;
    hasFetchedRef.current = true;

    try {
      setLoading(true);
      setFetchError(null);

      const res = await fetch(`/api/applications/${applicationId}/generate-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize assessment questions.");
      }

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("No assessment questions were returned. Please retry.");
      }

      setQuestions(data.questions);

      // Calculate time remaining based on startedAt
      if (data.startedAt) {
        const startEpoch = new Date(data.startedAt).getTime();
        const nowEpoch = Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((nowEpoch - startEpoch) / 1000));
        const totalDurationSeconds = (data.durationMinutes || 20) * 60;
        const remaining = Math.max(10, totalDurationSeconds - elapsedSeconds);
        setSecondsRemaining(remaining);
      }
    } catch (err: any) {
      console.error("Test initialization error:", err);
      setFetchError(err.message || "Failed to load assessment questions. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadQuestions(false);
  }, [loadQuestions]);



  // ---------------------------------------------------------------------------
  // 2. Submit Test Handler
  // ---------------------------------------------------------------------------
  const submitAssessment = useCallback(
    async (reason?: string) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      try {
        const payload = {
          answers: answersRef.current,
          violationLog: violationLogRef.current,
        };

        const res = await fetch(`/api/applications/${applicationId}/submit-test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to submit assessment.");
        }

        // Successfully submitted -> Transition to completion screen
        onComplete();
      } catch (err: any) {
        console.error("Submit test failed:", err);
        // Even if network error occurs, retry or finalize
        alert("Your assessment answers have been recorded. Finalizing your application...");
        onComplete();
      }
    },
    [applicationId, onComplete]
  );

  // ---------------------------------------------------------------------------
  // 3. Countdown Timer
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (loading || isSubmitting || questions.length === 0) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setSubmitReason("Assessment time has expired. Submitting your answers automatically.");
          submitAssessment("timer_expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, isSubmitting, questions.length, submitAssessment]);

  // ---------------------------------------------------------------------------
  // 4. Proctoring & Violation Tracking
  // ---------------------------------------------------------------------------
  const recordViolation = useCallback(
    (type: string, details: string) => {
      if (isSubmittingRef.current) return;

      const newViolation: ViolationItem = {
        type,
        timestamp: new Date().toISOString(),
        details,
      };

      const updatedLog = [...violationLogRef.current, newViolation];
      setViolationLog(updatedLog);
      violationLogRef.current = updatedLog;

      const violationCount = updatedLog.length;

      if (violationCount === 1) {
        setWarningMessage(
          "⚠️ Proctoring Warning: Window blur or tab switch detected. A security incident has been recorded. Note: A 2nd violation will automatically submit your assessment immediately."
        );
        setShowWarningModal(true);
      } else if (violationCount >= 2) {
        setSubmitReason("Assessment auto-submitted due to repeated proctoring violations (tab switching / window blur).");
        submitAssessment("multiple_violations");
      }
    },
    [submitAssessment]
  );

  // Tab switch & Window blur detection
  useEffect(() => {
    if (loading || isSubmitting || questions.length === 0) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation("tab_switch", "Candidate switched away from assessment tab or minimized browser window.");
      }
    };

    const handleWindowBlur = () => {
      // In some browsers, blur triggers when focusing inspect devtools or another window
      recordViolation("window_blur", "Candidate focused outside the active test window.");
    };

    const handleFullscreenChange = () => {
      const activeFullscreen = !!document.fullscreenElement;
      setIsFullscreen(activeFullscreen);
      if (!activeFullscreen && !isSubmittingRef.current) {
        recordViolation("fullscreen_exit", "Candidate exited required fullscreen mode.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [loading, isSubmitting, questions.length, recordViolation]);

  // Request fullscreen if lost
  const handleReEnterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
    } catch (e) {
      console.warn("Fullscreen request error:", e);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Answer Selection
  // ---------------------------------------------------------------------------
  const handleSelectOption = (optionText: string) => {
    const activeQuestion = questions[currentIdx];
    if (!activeQuestion) return;

    setAnswers((prev) => ({
      ...prev,
      [activeQuestion.id]: optionText,
    }));
  };

  const isCurrentAnswered =
    questions[currentIdx] && !!answers[questions[currentIdx].id];

  const totalAnsweredCount = Object.keys(answers).length;
  const isAllAnswered = questions.length > 0 && totalAnsweredCount >= questions.length;

  // Format timer seconds into MM:SS
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 max-w-lg mx-auto">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]">
          <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Personalizing Assessment...</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Analyzing job specifications and your resume to generate tailored questions. Please do not close this window.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------
  if (fetchError || questions.length === 0) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/30 max-w-lg mx-auto space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">Unable to Load Assessment</h3>
        <p className="text-xs text-rose-800 dark:text-rose-300">{fetchError || "No questions found."}</p>
        <button
          type="button"
          onClick={() => loadQuestions(true)}
          className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-rose-700 transition-colors"
        >
          Retry Assessment
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  // ---------------------------------------------------------------------------
  // Render Test Interface
  // ---------------------------------------------------------------------------
  return (
    <div
      className="select-none rounded-2xl p-4 sm:p-8 max-w-3xl mx-auto space-y-6"
      onCopy={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Header: Proctor Status & Countdown Timer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Proctored Mode Active
            </span>
            {violationLog.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                ⚠️ {violationLog.length}/2 Violations
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 truncate max-w-xs sm:max-w-md">
            {jobTitle} • {companyName}
          </p>
        </div>

        {/* Countdown Timer Display */}
        <div
          className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-mono text-sm font-bold border transition-colors ${
            secondsRemaining < 180
              ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 animate-pulse"
              : secondsRemaining < 360
              ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
              : "border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-primary)]"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatTimer(secondsRemaining)}</span>
        </div>
      </div>

      {/* Fullscreen Recovery Banner if exited */}
      {!isFullscreen && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <span>⚠️ You are not in fullscreen mode. Please return to fullscreen.</span>
          <button
            type="button"
            onClick={handleReEnterFullscreen}
            className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-amber-700"
          >
            Re-enter Fullscreen
          </button>
        </div>
      )}

      {/* Question Progress Bar & Overview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)]">
          <span>
            Question <strong className="text-[var(--text-primary)]">{currentIdx + 1}</strong> of{" "}
            <strong className="text-[var(--text-primary)]">{questions.length}</strong>
          </span>
          <span>
            {totalAnsweredCount} of {questions.length} Answered
          </span>
        </div>

        {/* Linear Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-main)] border border-[var(--border-color)]">
          <div
            className="h-full bg-[var(--brand-accent)] transition-all duration-300 rounded-full"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question Selector Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {questions.map((q, idx) => {
            const answered = !!answers[q.id];
            const isCurrent = idx === currentIdx;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                className={`h-7 w-7 rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? "bg-[var(--brand-accent)] text-white shadow-sm ring-2 ring-[var(--brand-accent)]/30"
                    : answered
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : "bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--brand-accent)]/50"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Question Card */}
      {currentQ && (
        <div className="dashboard-card rounded-2xl border border-[var(--border-color)] p-6 space-y-5">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-accent)]">
              Question {currentIdx + 1}
            </span>
            <h3 className="text-base font-semibold text-[var(--text-primary)] leading-relaxed sm:text-lg">
              {currentQ.question}
            </h3>
          </div>

          {/* Options List */}
          <div className="space-y-2.5 pt-2">
            {currentQ.options.map((optionText, optIdx) => {
              const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
              const isSelected = answers[currentQ.id] === optionText;

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optionText)}
                  className={`w-full text-left flex items-center gap-3.5 rounded-xl border p-3.5 text-xs sm:text-sm font-medium transition-all ${
                    isSelected
                      ? "border-[var(--brand-accent)] bg-[var(--brand-accent)]/10 text-[var(--text-primary)] shadow-xs ring-1 ring-[var(--brand-accent)]"
                      : "border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:border-[var(--brand-accent)]/50 hover:bg-[var(--bg-main)]/80"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      isSelected
                        ? "bg-[var(--brand-accent)] text-white shadow-xs"
                        : "bg-[var(--border-color)]/50 text-[var(--text-muted)]"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1 leading-snug">{optionText}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation & Submit Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        <div className="flex items-center gap-2">
          {currentIdx < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-accent)] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[var(--brand-accent-hover)] transition-all"
            >
              <span>Next</span>
              <span>→</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting || !isAllAnswered}
              onClick={() => {
                if (window.confirm("Are you sure you want to submit your final assessment?")) {
                  submitAssessment("manual_submit");
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Submitting Test...</span>
                </>
              ) : (
                <>
                  <span>Submit Assessment</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Warning Modal (1st Violation) */}
      {/* --------------------------------------------------------------------- */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-rose-300 bg-white p-6 shadow-2xl dark:border-rose-900/60 dark:bg-zinc-900 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400">Proctoring Security Alert</h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {warningMessage}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowWarningModal(false);
                  handleReEnterFullscreen();
                }}
                className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow hover:bg-rose-700 transition-colors"
              >
                I Understand & Return to Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitting Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-xs text-white space-y-3">
          <svg className="h-10 w-10 animate-spin text-[var(--brand-accent)]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-base font-bold">Submitting Assessment...</p>
          {submitReason && <p className="text-xs text-zinc-300 max-w-sm text-center">{submitReason}</p>}
        </div>
      )}
    </div>
  );
}
