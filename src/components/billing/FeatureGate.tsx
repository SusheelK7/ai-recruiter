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

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  className?: string;
}

export function FeatureGate({
  feature,
  children,
  fallbackTitle,
  fallbackDescription,
  className = "",
}: FeatureGateProps) {
  const [status, setStatus] = useState<BillingStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadStatus() {
      try {
        const res = await fetch("/api/billing/status");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setStatus(data);
        }
      } catch (err) {
        console.error("Failed to load billing status for FeatureGate:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStatus();
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

  // Headroom check for Pro users approaching limits (e.g. AI scans >= 80%)
  const isNearAiCap =
    status.plan === "pro" &&
    status.usage?.aiScans &&
    status.usage.aiScans.percent >= 80;

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

      {/* If feature is unlocked, render children directly */}
      {isUnlocked ? (
        children
      ) : (
        /* Locked Feature Preview with dimmed, blurred overlay and teaser CTA */
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-300/80 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
          {/* Dimmed & Non-interactive preview of children */}
          <div
            className="pointer-events-none select-none opacity-30 filter blur-[1.5px] transition-all duration-300 group-hover:opacity-25"
            aria-hidden="true"
          >
            {children}
          </div>

          {/* Frosted Glass Lock Card Overlay */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-[2px]">
            <div className="relative mx-auto flex max-w-md flex-col items-center rounded-2xl border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-zinc-700/80 dark:bg-zinc-900/90 sm:p-8">
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
      )}
    </div>
  );
}
