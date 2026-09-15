"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { type FeatureKey, FEATURE_NAMES } from "@/lib/plans";

interface BillingStatusResponse {
  plan: string;
  planName: string;
  features: Record<FeatureKey, boolean>;
  usage?: {
    jobs: { current: number; limit: number; remaining: number; percent: number };
    aiScans: { current: number; limit: number; remaining: number; percent: number };
    seats: { current: number; limit: number; remaining: number; percent: number };
  };
}

export interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  className?: string;
  variant?: "card" | "banner" | "inline";
}

// Module-level cache to prevent redundant /api/billing/status fetches across multiple cards
let cachedBillingStatus: BillingStatusResponse | null = null;
let statusFetchPromise: Promise<BillingStatusResponse | null> | null = null;

async function fetchCachedBillingStatus(): Promise<BillingStatusResponse | null> {
  if (cachedBillingStatus) return cachedBillingStatus;
  if (!statusFetchPromise) {
    statusFetchPromise = fetch("/api/billing/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        cachedBillingStatus = data;
        return data;
      })
      .catch((err) => {
        console.error("Failed to load billing status:", err);
        return null;
      })
      .finally(() => {
        statusFetchPromise = null;
      });
  }
  return statusFetchPromise;
}

export function UpgradeModal({
  title,
  description,
  onClose,
  onUpgrade,
  upgrading,
}: {
  title: string;
  description: string;
  onClose: () => void;
  onUpgrade: () => void;
  upgrading: boolean;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Close modal"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-violet-500"></span>
            </span>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
            Available on Pro & Above
          </span>
          <h3 className="mt-2.5 text-lg font-bold text-zinc-900 dark:text-white sm:text-xl">
            {title}
          </h3>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm leading-relaxed">
            {description}
          </p>

          <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={onUpgrade}
              disabled={upgrading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-600/25 transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50"
            >
              {upgrading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Connecting to Stripe...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Upgrade to Unlock
                </>
              )}
            </button>

            <Link
              href="/dashboard/billing"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              View Plan Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeatureGate({
  feature,
  children,
  fallbackTitle,
  fallbackDescription,
  className = "",
  variant = "card",
}: FeatureGateProps) {
  const [status, setStatus] = useState<BillingStatusResponse | null>(cachedBillingStatus);
  const [loading, setLoading] = useState(!cachedBillingStatus);
  const [upgrading, setUpgrading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchCachedBillingStatus().then((data) => {
      if (isMounted) {
        setStatus(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuickUpgrade = async () => {
    try {
      setUpgrading(true);
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = "/dashboard/billing";
      }
    } catch {
      window.location.href = "/dashboard/billing";
    } finally {
      setUpgrading(false);
    }
  };

  // While checking, render child transparently to avoid layout shift
  if (loading || !status) {
    return <div className={`relative ${className}`}>{children}</div>;
  }

  const isUnlocked = !!status.features?.[feature];
  const featureMeta = FEATURE_NAMES[feature];
  const title = fallbackTitle || featureMeta?.name || "Pro Feature";
  const description =
    fallbackDescription ||
    featureMeta?.description ||
    "Unlock this feature to accelerate hiring with automated intelligence.";

  // If feature is unlocked, render children directly
  if (isUnlocked) {
    return <>{children}</>;
  }

  // VARIANT 1: Inline / Button lock
  if (variant === "inline") {
    return (
      <>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(true);
          }}
          className={`inline-flex items-center cursor-pointer group ${className}`}
          title={`${title} - Click to unlock with Pro`}
        >
          <div className="pointer-events-none select-none opacity-80 transition-opacity group-hover:opacity-100">
            {children}
          </div>
          <span className="ml-1.5 inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm transition-transform group-hover:scale-105">
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            PRO
          </span>
        </div>

        {showModal && (
          <UpgradeModal
            title={title}
            description={description}
            onClose={() => setShowModal(false)}
            onUpgrade={handleQuickUpgrade}
            upgrading={upgrading}
          />
        )}
      </>
    );
  }

  // VARIANT 2: Wide horizontal banner (e.g. Technical Assessment Section)
  if (variant === "banner") {
    return (
      <div
        className={`rounded-xl border border-violet-200/90 bg-gradient-to-r from-violet-50/80 via-indigo-50/50 to-[var(--bg-main)] p-4 shadow-sm dark:border-violet-900/60 dark:from-violet-950/30 dark:via-indigo-950/20 dark:to-[var(--bg-main)] ${className}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  {title}
                </h5>
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-950/70 dark:text-violet-300">
                  PRO FEATURE
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-muted)] leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleQuickUpgrade}
              disabled={upgrading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-violet-500/25 transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {upgrading ? "Connecting..." : "Unlock with Pro"}
            </button>
            <Link
              href="/dashboard/billing"
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:border-violet-400 hover:text-violet-600"
            >
              Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Headroom check for Pro users approaching limits (e.g. AI scans >= 80%)
  const isNearAiCap =
    status.plan === "pro" &&
    status.usage?.aiScans &&
    status.usage.aiScans.percent >= 80;

  // VARIANT 3: Default Card / Full section (e.g. Analytics page)
  return (
    <div className={`relative ${className}`}>
      {/* Inline headroom upgrade alert for Pro users approaching Business cap */}
      {isNearAiCap && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-2.5 text-xs text-amber-900 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <span>
              <strong>Approaching Plan Limit:</strong> You have utilized{" "}
              {status.usage?.aiScans.current} of {status.usage?.aiScans.limit} AI candidate screenings ({status.usage?.aiScans.percent}%).
            </span>
          </div>
          <Link
            href="/dashboard/billing"
            className="rounded-lg bg-amber-600 px-3 py-1 font-semibold text-white transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            Upgrade to Business
          </Link>
        </div>
      )}

      {/* Locked Feature Preview with dimmed overlay and teaser CTA */}
      <div className="group relative min-h-[300px] overflow-hidden rounded-2xl border border-zinc-300/80 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30 flex flex-col justify-center">
        {/* Dimmed & Non-interactive preview of children */}
        <div
          className="pointer-events-none select-none opacity-25 filter blur-[2px] transition-all duration-300 group-hover:opacity-20 flex-1"
          aria-hidden="true"
        >
          {children}
        </div>

        {/* Frosted Glass Lock Card Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-[2px]">
          <div className="relative mx-auto flex max-w-md flex-col items-center rounded-2xl border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-zinc-700/80 dark:bg-zinc-900/95 sm:p-8">
            {/* Glowing Padlock Badge */}
            <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex h-4 w-4 rounded-full bg-violet-500"></span>
              </span>
            </div>

            {/* Tag & Title */}
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
              Available on Pro & Above
            </span>
            <h4 className="mt-2 text-base font-bold text-zinc-900 dark:text-white sm:text-lg">
              {title}
            </h4>
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm">
              {description}
            </p>

            {/* Action Buttons */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleQuickUpgrade}
                disabled={upgrading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-600/25 transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50"
              >
                {upgrading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Connecting to Stripe...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Upgrade to Unlock
                  </>
                )}
              </button>

              <Link
                href="/dashboard/billing"
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                View Plan Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
