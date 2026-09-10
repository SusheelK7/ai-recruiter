"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { MobileMenuButton } from "@/components/dashboard/MobileMenuButton";

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

interface CompanyProfile {
  id: string;
  name: string;
  email: string;
  plan: string;
  industry: string | null;
  foundedYear: number | null;
  employeeCount: string | null;
  website: string | null;
  location: string | null;
  description: string | null;
  logoUrl: string | null;
  profileCompleted: boolean;
  createdAt: string;
}

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Editable fields
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const populateForm = useCallback((c: CompanyProfile) => {
    setName(c.name || "");
    setIndustry(c.industry || "");
    setFoundedYear(c.foundedYear ? String(c.foundedYear) : "");
    setEmployeeCount(c.employeeCount || "");
    setWebsite(c.website || "");
    setLocation(c.location || "");
    setDescription(c.description || "");
    setLogoUrl(c.logoUrl || "");
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/company/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.company);
          populateForm(data.company);
        }
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [populateForm]);

  const handleCancel = () => {
    if (profile) populateForm(profile);
    setEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/company/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          industry: industry || null,
          foundedYear: foundedYear ? Number(foundedYear) : null,
          employeeCount: employeeCount || null,
          website: website.trim() || null,
          location: location.trim() || null,
          description: description.trim() || null,
          logoUrl: logoUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save.");
        setSaving(false);
        return;
      }

      const data = await res.json();
      setProfile(data.company);
      populateForm(data.company);
      setEditing(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-accent)] border-t-transparent" />
          <p className="text-sm text-[var(--text-muted)]">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      <ScrollReveal durationMs={400} distancePx={16}>
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-start md:justify-between lg:items-center">
          <div className="flex items-start gap-3">
            <MobileMenuButton />
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
                Company Profile
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)] sm:text-base">
                Manage your company information visible to candidates.
              </p>
            </div>
          </div>
          {!editing ? (
            <button
              type="button"
              onClick={() => { setEditing(true); setSuccess(""); }}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--brand-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--brand-accent-hover)] active:scale-[0.98] md:w-auto"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 md:flex-none rounded-xl border border-[var(--border-color)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <PrimaryButton
                type="button"
                onClick={handleSave}
                isLoading={saving}
                disabled={saving || name.trim().length === 0}
                className="flex-1 md:flex-none px-6 py-2.5"
              >
                Save Changes
              </PrimaryButton>
            </div>
          )}
        </header>
      </ScrollReveal>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fade-slide">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 animate-fade-slide">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Profile Preview Card */}
        <ScrollReveal staggerIndex={0} durationMs={400} distancePx={16}>
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-sm xl:sticky xl:top-6">
            <div className="flex flex-col items-center text-center">
              {/* Avatar / Logo */}
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={editing ? logoUrl : (profile?.logoUrl || "")}
                  alt={name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-[var(--border-color)] mb-4"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[var(--brand-accent)]/15 flex items-center justify-center text-3xl font-bold text-[var(--brand-accent)] mb-4">
                  {(editing ? name : profile?.name || "C").charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {editing ? name || "Company Name" : profile?.name}
              </h2>
              {(editing ? industry : profile?.industry) && (
                <span className="mt-1 inline-block text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]">
                  {editing ? industry : profile?.industry}
                </span>
              )}
              <p className="mt-2 text-xs text-[var(--text-muted)]">{profile?.email}</p>

              {/* Quick Stats */}
              <div className="mt-5 w-full grid grid-cols-2 gap-3">
                {(editing ? foundedYear : profile?.foundedYear) && (
                  <div className="rounded-xl bg-[var(--bg-main)] p-3 text-center">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Founded</p>
                    <p className="text-sm font-bold mt-0.5">{editing ? foundedYear : profile?.foundedYear}</p>
                  </div>
                )}
                {(editing ? employeeCount : profile?.employeeCount) && (
                  <div className="rounded-xl bg-[var(--bg-main)] p-3 text-center">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Team Size</p>
                    <p className="text-sm font-bold mt-0.5">{editing ? employeeCount : profile?.employeeCount}</p>
                  </div>
                )}
                {(editing ? location : profile?.location) && (
                  <div className="rounded-xl bg-[var(--bg-main)] p-3 text-center col-span-2">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Location</p>
                    <p className="text-sm font-bold mt-0.5">{editing ? location : profile?.location}</p>
                  </div>
                )}
              </div>

              {/* Plan Badge */}
              <div className="mt-4 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                Plan:{" "}
                <span className="font-bold text-[var(--brand-accent)] capitalize">
                  {profile?.plan || "free"}
                </span>
              </div>

              {/* Member Since */}
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Member since{" "}
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Edit / View Form */}
        <ScrollReveal staggerIndex={1} durationMs={400} distancePx={16}>
          <div className="xl:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-sm">
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Basic Information</h3>
              <p className="text-xs text-[var(--text-muted)] mb-5">Core company details</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editing ? (
                  <>
                    <Input
                      label="Company Name"
                      type="text"
                      placeholder="Acme Corp"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <Input
                      label="Founded Year"
                      type="number"
                      placeholder={`${currentYear - 5}`}
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
                          <option key={range} value={range}>{range} employees</option>
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
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <InfoRow label="Company Name" value={profile?.name} />
                    <InfoRow label="Founded Year" value={profile?.foundedYear ? String(profile.foundedYear) : null} />
                    <InfoRow label="Employees" value={profile?.employeeCount} />
                    <InfoRow label="Industry" value={profile?.industry} />
                  </>
                )}
              </div>
            </div>

            {/* Presence / Details */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-sm">
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Company Presence</h3>
              <p className="text-xs text-[var(--text-muted)] mb-5">How candidates find and learn about you</p>

              <div className="space-y-4">
                {editing ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Website"
                        type="url"
                        placeholder="https://yourcompany.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                      <Input
                        label="Location"
                        type="text"
                        placeholder="San Francisco, CA"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 uppercase">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell candidates about your company..."
                        rows={4}
                        maxLength={500}
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all duration-200 ease-out outline-none bg-white dark:bg-[#1A2233] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border-zinc-200 dark:border-zinc-700/80 focus:border-[#2E5B8A] dark:focus:border-[#4A7FC1] focus:ring-2 focus:ring-[#2E5B8A]/20 dark:focus:ring-[#4A7FC1]/25 resize-none"
                      />
                      <p className="text-[10px] text-[var(--text-muted)] text-right">{description.length}/500</p>
                    </div>
                    <Input
                      label="Logo URL"
                      type="url"
                      placeholder="https://yourcompany.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      helperText="Paste a link to your company logo"
                    />
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoRow label="Website" value={profile?.website} isLink />
                      <InfoRow label="Location" value={profile?.location} />
                    </div>
                    <InfoRow label="Description" value={profile?.description} fullWidth />
                    <InfoRow label="Logo URL" value={profile?.logoUrl} isLink />
                  </>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  isLink = false,
  fullWidth = false,
}: {
  label: string;
  value: string | null | undefined;
  isLink?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-muted)] mb-1">{label}</p>
      {value ? (
        isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--brand-accent)] hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">{value}</p>
        )
      ) : (
        <p className="text-sm text-[var(--text-muted)] italic">Not set</p>
      )}
    </div>
  );
}
