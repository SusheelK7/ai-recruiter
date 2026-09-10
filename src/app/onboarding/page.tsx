"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

const EMPLOYEE_RANGES = [
  "1–10",
  "11–50",
  "51–200",
  "201–500",
  "501–1,000",
  "1,000+",
];

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance & Banking",
  "Education",
  "E-commerce & Retail",
  "Manufacturing",
  "Media & Entertainment",
  "Consulting",
  "Real Estate",
  "Logistics & Supply Chain",
  "Energy & Utilities",
  "Legal",
  "Telecommunications",
  "Government & Public Sector",
  "Other",
];

const TOTAL_STEPS = 3;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-[var(--brand-accent)] text-white shadow-lg shadow-[var(--brand-accent)]/30 scale-110"
                    : isDone
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive
                    ? "text-[var(--text-primary)]"
                    : isDone
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {step === 1 ? "Basics" : step === 2 ? "Details" : "Summary"}
              </span>
            </div>
            {i < TOTAL_STEPS - 1 && (
              <div
                className={`h-[2px] w-10 sm:w-14 rounded-full mb-5 transition-colors duration-300 ${
                  step < current ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1 fields
  const [companyName, setCompanyName] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [industry, setIndustry] = useState("");

  // Step 2 fields
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Load existing company name from profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/company/profile");
        if (res.ok) {
          const data = await res.json();
          const c = data.company;
          if (c.profileCompleted) {
            router.push("/dashboard");
            return;
          }
          if (c.name) setCompanyName(c.name);
          if (c.foundedYear) setFoundedYear(String(c.foundedYear));
          if (c.employeeCount) setEmployeeCount(c.employeeCount);
          if (c.industry) setIndustry(c.industry);
          if (c.website) setWebsite(c.website);
          if (c.location) setLocation(c.location);
          if (c.description) setDescription(c.description);
          if (c.logoUrl) setLogoUrl(c.logoUrl);
        }
      } catch {
        // silently fail — user can fill in manually
      }
    }
    loadProfile();
  }, [router]);

  const isStep1Valid =
    companyName.trim().length > 0 &&
    employeeCount.length > 0 &&
    industry.length > 0;

  const handleNext = () => {
    setError("");
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/company/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName.trim(),
          foundedYear: foundedYear ? Number(foundedYear) : null,
          employeeCount: employeeCount || null,
          industry: industry || null,
          website: website.trim() || null,
          location: location.trim() || null,
          description: description.trim() || null,
          logoUrl: logoUrl.trim() || null,
          profileCompleted: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save. Please try again.");
        setSaving(false);
        return;
      }

      // Update the profileCompleted cookie
      document.cookie = `profileCompleted=true; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-accent)] text-sm font-bold text-white">
            AI
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">AI Recruiter</span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">Setup your company profile</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg">
          {/* Card */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-sm transition-all">
            <StepIndicator current={step} />

            {/* Error */}
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Basics */}
            {step === 1 && (
              <div className="animate-fade-slide flex flex-col gap-4">
                <div className="mb-1">
                  <h2 className="text-xl font-bold tracking-tight">Tell us about your company</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Basic information to personalize your recruiting experience.
                  </p>
                </div>

                <Input
                  label="Company Name"
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />

                <Input
                  label="Founded Year"
                  type="number"
                  placeholder={`e.g. ${currentYear - 5}`}
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value)}
                  min="1800"
                  max={String(currentYear)}
                />

                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 uppercase">
                    Number of Employees
                  </label>
                  <select
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all duration-200 ease-out outline-none bg-white dark:bg-[#1A2233] text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700/80 focus:border-[#2E5B8A] dark:focus:border-[#4A7FC1] focus:ring-2 focus:ring-[#2E5B8A]/20 dark:focus:ring-[#4A7FC1]/25 appearance-none cursor-pointer"
                  >
                    <option value="">Select range...</option>
                    {EMPLOYEE_RANGES.map((range) => (
                      <option key={range} value={range}>
                        {range} employees
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 uppercase">
                    Industry
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all duration-200 ease-out outline-none bg-white dark:bg-[#1A2233] text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700/80 focus:border-[#2E5B8A] dark:focus:border-[#4A7FC1] focus:ring-2 focus:ring-[#2E5B8A]/20 dark:focus:ring-[#4A7FC1]/25 appearance-none cursor-pointer"
                  >
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end mt-2">
                  <PrimaryButton
                    type="button"
                    disabled={!isStep1Valid}
                    onClick={handleNext}
                    className="px-8 py-2.5"
                  >
                    Continue
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="animate-fade-slide flex flex-col gap-4">
                <div className="mb-1">
                  <h2 className="text-xl font-bold tracking-tight">Your company&apos;s presence</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Help candidates learn more about you. All fields are optional.
                  </p>
                </div>

                <Input
                  label="Website"
                  type="url"
                  placeholder="https://yourcompany.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />

                <Input
                  label="Headquarters / Location"
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />

                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 uppercase">
                    Company Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell candidates what your company does, your mission, culture..."
                    rows={4}
                    maxLength={500}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all duration-200 ease-out outline-none bg-white dark:bg-[#1A2233] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border-zinc-200 dark:border-zinc-700/80 focus:border-[#2E5B8A] dark:focus:border-[#4A7FC1] focus:ring-2 focus:ring-[#2E5B8A]/20 dark:focus:ring-[#4A7FC1]/25 resize-none"
                  />
                  <p className="text-[10px] text-[var(--text-muted)] text-right">{description.length}/500</p>
                </div>

                <Input
                  label="Company Logo URL"
                  type="url"
                  placeholder="https://yourcompany.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  helperText="Paste a link to your company logo image"
                />

                <div className="flex justify-between mt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-5 py-2.5 text-sm font-medium rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                  >
                    ← Back
                  </button>
                  <PrimaryButton
                    type="button"
                    onClick={handleNext}
                    className="px-8 py-2.5"
                  >
                    Continue
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* Step 3: Summary / Review */}
            {step === 3 && (
              <div className="animate-fade-slide flex flex-col gap-5">
                <div className="mb-1">
                  <h2 className="text-xl font-bold tracking-tight">Review your profile</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Make sure everything looks good. You can always edit this later.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-5 space-y-3">
                  {/* Logo + Name Header */}
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoUrl}
                        alt={companyName}
                        className="w-12 h-12 rounded-xl object-cover border border-[var(--border-color)]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[var(--brand-accent)]/15 flex items-center justify-center text-lg font-bold text-[var(--brand-accent)]">
                        {companyName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">{companyName}</h3>
                      {industry && (
                        <span className="inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]">
                          {industry}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detail Rows */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-2 border-t border-[var(--border-color)]">
                    {foundedYear && (
                      <div>
                        <span className="text-[var(--text-muted)]">Founded</span>
                        <p className="font-medium">{foundedYear}</p>
                      </div>
                    )}
                    {employeeCount && (
                      <div>
                        <span className="text-[var(--text-muted)]">Employees</span>
                        <p className="font-medium">{employeeCount}</p>
                      </div>
                    )}
                    {location && (
                      <div>
                        <span className="text-[var(--text-muted)]">Location</span>
                        <p className="font-medium">{location}</p>
                      </div>
                    )}
                    {website && (
                      <div>
                        <span className="text-[var(--text-muted)]">Website</span>
                        <p className="font-medium truncate">{website}</p>
                      </div>
                    )}
                  </div>

                  {description && (
                    <div className="text-xs pt-2 border-t border-[var(--border-color)]">
                      <span className="text-[var(--text-muted)]">About</span>
                      <p className="mt-1 leading-relaxed">{description}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-1">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-5 py-2.5 text-sm font-medium rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                  >
                    ← Back
                  </button>
                  <PrimaryButton
                    type="button"
                    onClick={handleSubmit}
                    isLoading={saving}
                    disabled={saving}
                    className="px-8 py-2.5"
                  >
                    🚀 Launch Dashboard
                  </PrimaryButton>
                </div>
              </div>
            )}
          </div>

          {/* Skip for now */}
          {step < TOTAL_STEPS && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setStep(TOTAL_STEPS)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] underline underline-offset-2 transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
