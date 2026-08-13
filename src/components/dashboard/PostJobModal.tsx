"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { experienceLevels, type CreateJobInput } from "@/lib/validations/job";
import type { CreatedJob } from "@/components/dashboard/types";

interface PostJobModalProps {
  open: boolean;
  onClose: () => void;
  onJobCreated: (job: CreatedJob) => void;
}

type FormErrors = Partial<Record<keyof CreateJobInput | "requiredSkills" | "root", string>>;

const EXPIRY_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "15 days", value: 15 },
  { label: "30 days", value: 30 },
] as const;

export function PostJobModal({ open, onClose, onJobCreated }: PostJobModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<(typeof experienceLevels)[number]>("mid");
  const [expiryDays, setExpiryDays] = useState<7 | 15 | 30 | null>(15);
  const [customExpiryDate, setCustomExpiryDate] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!open) return null;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSkillsInput("");
    setExperienceLevel("mid");
    setExpiryDays(15);
    setCustomExpiryDate("");
    setErrors({});
  };

  const handleGenerate = async () => {
    if (title.trim().length < 3) {
      setErrors({ title: "Enter a job title first (min 3 characters)" });
      return;
    }

    setIsGenerating(true);
    setErrors({});

    try {
      const res = await fetch("/api/ai/generate-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          experienceLevel,
          keywords: description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({ root: data.error || "Failed to generate content" });
        return;
      }

      setDescription(data.description);
      setSkillsInput(data.requiredSkills.join(", "));
    } catch {
      setErrors({ root: "Failed to generate content. Please try again." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const requiredSkills = skillsInput
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const payload = {
      title,
      description,
      requiredSkills,
      experienceLevel,
      expiryDays: customExpiryDate ? undefined : (expiryDays ?? undefined),
      customExpiryDate: customExpiryDate || undefined,
    };

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const message =
          data.details?.fieldErrors?.title?.[0] ||
          data.details?.fieldErrors?.description?.[0] ||
          data.details?.fieldErrors?.requiredSkills?.[0] ||
          data.error ||
          "Failed to create job";
        setErrors({ root: message });
        return;
      }

      onJobCreated(data.job);
      resetForm();
      onClose();
    } catch {
      setErrors({ root: "Failed to create job. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-[var(--bg-card)] p-4 shadow-2xl transition-colors duration-300 sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Post a New Job</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Create a role and share it with candidates instantly.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Job Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            error={errors.title}
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div>
                <label className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 uppercase">
                  Description / Keywords
                </label>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Type keywords, location, salary or short notes below &amp; click Generate with AI
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-accent)]/10 px-3 py-2 text-xs font-semibold text-[var(--brand-accent)] transition-colors hover:bg-[var(--brand-accent)] hover:text-white disabled:opacity-60 sm:w-auto sm:py-1.5 shrink-0"
              >
                {isGenerating ? "Generating..." : "✨ Generate with AI"}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={14}
              placeholder={"Type your keywords or a short summary here (e.g. Remote, US $120k-$150k, Next.js, 5+ yrs exp, fast-paced startup)... then click 'Generate with AI'!"}
              className="min-h-[280px] w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 font-mono text-xs leading-relaxed text-zinc-900 transition-all outline-none focus:border-[#2E5B8A] focus:ring-2 focus:ring-[#2E5B8A]/20 sm:text-sm dark:border-zinc-700/80 dark:bg-[#1A2233] dark:text-zinc-100 dark:focus:border-[#4A7FC1] dark:focus:ring-[#4A7FC1]/25"
            />
            {errors.description && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors.description}</p>
            )}
          </div>

          <Input
            label="Required Skills"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="React, TypeScript, Node.js (comma-separated)"
            helperText="Separate skills with commas"
            error={errors.requiredSkills}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 uppercase">
              Experience Level
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {experienceLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setExperienceLevel(level)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium capitalize transition-all ${
                    experienceLevel === level
                      ? "bg-[var(--brand-accent)] text-white shadow-sm"
                      : "border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 uppercase">
              Expiry
            </label>
            <div className="flex flex-wrap gap-2">
              {EXPIRY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setExpiryDays(option.value);
                    setCustomExpiryDate("");
                  }}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    expiryDays === option.value && !customExpiryDate
                      ? "bg-[var(--brand-accent)] text-white shadow-sm"
                      : "border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Input
              label="Custom Expiry Date"
              type="date"
              value={customExpiryDate}
              onChange={(e) => {
                setCustomExpiryDate(e.target.value);
                if (e.target.value) setExpiryDays(null);
              }}
              containerClassName="mt-2"
            />
          </div>

          {errors.root && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {errors.root}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-main)]"
            >
              Cancel
            </button>
            <PrimaryButton type="submit" isLoading={isSubmitting} fullWidth className="flex-1 !rounded-xl">
              Create Job
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
