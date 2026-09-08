"use client";

import React, { useState, useEffect } from "react";

export interface ScheduleInterviewCandidate {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  existingScheduledTime?: string | null;
}

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: ScheduleInterviewCandidate | null;
  onScheduled: (result: { interview: any; emailSent: boolean; emailWarning?: string }) => void;
}

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  candidate,
  onScheduled,
}: ScheduleInterviewModalProps) {
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute minimum selectable datetime (now + 2 minutes in local ISO format)
  const getMinDateTime = () => {
    const now = new Date(Date.now() + 2 * 60 * 1000);
    // Format to YYYY-MM-DDTHH:mm in local time
    const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
    const localISOTime = new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 16);
    return localISOTime;
  };

  // Reset form when candidate changes or modal opens
  useEffect(() => {
    if (isOpen && candidate) {
      if (candidate.existingScheduledTime) {
        const existingDate = new Date(candidate.existingScheduledTime);
        const tzOffsetMs = existingDate.getTimezoneOffset() * 60 * 1000;
        const localISOTime = new Date(existingDate.getTime() - tzOffsetMs).toISOString().slice(0, 16);
        setScheduledTime(localISOTime);
      } else {
        // Default to tomorrow 10:00 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        const tzOffsetMs = tomorrow.getTimezoneOffset() * 60 * 1000;
        const localISOTime = new Date(tomorrow.getTime() - tzOffsetMs).toISOString().slice(0, 16);
        setScheduledTime(localISOTime);
      }
      setNotes("");
      setError(null);
    }
  }, [isOpen, candidate]);

  if (!isOpen || !candidate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledTime) {
      setError("Please pick a date and time for the interview.");
      return;
    }

    const selectedDate = new Date(scheduledTime);
    if (selectedDate <= new Date()) {
      setError("Interview date & time must be in the future.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: candidate.id,
          scheduledTime: selectedDate.toISOString(),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to schedule interview.");
      }

      onScheduled(data);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while scheduling.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Schedule Walk-In Interview</h3>
              <p className="text-xs text-[var(--text-muted)]">Set a date and send candidate confirmation email</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)] transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Candidate Card */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/60 p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{candidate.candidateName}</span>
              <span className="text-xs font-semibold text-[var(--brand-accent)]">{candidate.jobTitle}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">{candidate.candidateEmail}</p>
          </div>

          {/* Date & Time Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Interview Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              min={getMinDateTime()}
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
            />
            <p className="text-[11px] text-[var(--text-muted)]">Select a single walk-in date and time slot for the candidate.</p>
          </div>

          {/* Optional Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Notes / Instructions <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Please bring a printed copy of your portfolio or prepare a 5-minute system design overview."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2 text-xs text-[var(--text-primary)] focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
            />
          </div>

          {/* Notice Callout */}
          <div className="rounded-xl border border-violet-200/80 bg-violet-50/50 p-3 text-xs text-violet-800 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-200">
            <div className="flex items-start gap-2">
              <svg className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                An informational confirmation email with the date, time, and role will be sent immediately to the candidate via Gmail SMTP.
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-color)]">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-main)] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Scheduling...</span>
                </>
              ) : (
                <span>Confirm & Send Email</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
