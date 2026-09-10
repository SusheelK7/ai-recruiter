"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PLANS, type PlanKey } from "@/lib/plans";

interface UsageItem {
  current: number;
  limit: number;
  remaining: number;
  percent: number;
  isUnlimited?: boolean;
}

interface BillingStatusData {
  plan: PlanKey;
  planName: string;
  status: string;
  paymentIssue: boolean;
  renewsAt: string | null;
  hasCustomerPortal: boolean;
  features: {
    videoIntro: boolean;
    secureTest: boolean;
    chatbot: boolean;
    fullAnalytics: boolean;
  };
  usage: {
    jobs: UsageItem;
    aiScans: UsageItem;
    seats: UsageItem;
  };
}

interface InvoiceItem {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  pdfUrl?: string | null;
  hostedUrl?: string | null;
  description: string;
  planName: string;
  periodStart?: string | null;
  periodEnd?: string | null;
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<BillingStatusData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [companyInfo, setCompanyInfo] = useState<{ name: string; email: string; location?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  // Modals state
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // In-app card update state
  const [showUpdateCard, setShowUpdateCard] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardUpdating, setCardUpdating] = useState(false);
  const [cardSuccessMsg, setCardSuccessMsg] = useState<string | null>(null);
  const [cardErrorMsg, setCardErrorMsg] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/billing/status");
      if (!res.ok) throw new Error("Failed to load billing status");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setBannerNotice({
        type: "error",
        message: "Failed to load current subscription information. Please refresh.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      setInvoicesLoading(true);
      const res = await fetch("/api/billing/invoices");
      if (res.ok) {
        const json = await res.json();
        setInvoices(json.invoices || []);
        if (json.company) {
          setCompanyInfo(json.company);
        }
      }
    } catch (err) {
      console.warn("Could not fetch invoices:", err);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchInvoices();

    // Check redirect query params
    if (searchParams.get("success") === "true") {
      setBannerNotice({
        type: "success",
        message: "🎉 Success! Your subscription has been activated. Features have been unlocked.",
      });
    } else if (searchParams.get("canceled") === "true") {
      setBannerNotice({
        type: "warning",
        message: "Checkout was canceled. No charges were made.",
      });
    }
  }, [fetchStatus, fetchInvoices, searchParams]);

  const handleCheckout = async (planKey: PlanKey) => {
    try {
      setActionLoading(`checkout-${planKey}`);
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to initiate checkout");
      }
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: any) {
      setBannerNotice({
        type: "error",
        message: err.message || "Failed to initiate checkout with Stripe.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenPortal = async () => {
    try {
      setActionLoading("portal");
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const result = await res.json();
      if (result.url && !result.inAppPortal) {
        window.location.href = result.url;
        return;
      }
      // Open in-app billing & invoices manager
      setIsManageModalOpen(true);
    } catch (err: any) {
      // Gracefully open in-app billing manager
      setIsManageModalOpen(true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCanceling(true);
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to cancel subscription");
      }

      setBannerNotice({
        type: "warning",
        message: "Your subscription has been canceled and your account reset to the Free tier.",
      });
      setShowCancelConfirm(false);
      setIsManageModalOpen(false);
      await fetchStatus();
      await fetchInvoices();
    } catch (err: any) {
      setBannerNotice({
        type: "error",
        message: err.message || "Failed to cancel subscription.",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardErrorMsg(null);
    setCardSuccessMsg(null);

    if (!cardNumber || !expDate || !cvc) {
      setCardErrorMsg("Please fill in all card details.");
      return;
    }

    try {
      setCardUpdating(true);
      const currentPlan = data?.plan || "pro";
      const res = await fetch("/api/billing/mock-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: currentPlan === "free" ? "pro" : currentPlan,
          cardName: cardName || "Billing Contact",
          cardNumber,
          expDate,
          cvc,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update card details.");
      }

      setCardSuccessMsg("Payment method successfully updated!");
      setShowUpdateCard(false);
      setCardNumber("");
      setExpDate("");
      setCvc("");
      setCardName("");
      await fetchStatus();
      await fetchInvoices();
    } catch (err: any) {
      setCardErrorMsg(err.message || "Could not update card. Please verify details.");
    } finally {
      setCardUpdating(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-zinc-500">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  const currentPlanKey = data?.plan || "free";
  const currentPlan = PLANS[currentPlanKey];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-color)] pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Subscription & Billing
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Manage your recruitment plan, monitor resource usage, view invoices, and upgrade features.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenPortal}
            disabled={actionLoading === "portal"}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] shadow-sm transition hover:border-violet-500 hover:text-violet-600 disabled:opacity-50"
          >
            {actionLoading === "portal" ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Loading Portal...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Manage Billing & Invoices
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {bannerNotice && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-sm font-medium ${
            bannerNotice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
              : bannerNotice.type === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
              : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
          }`}
        >
          <span>{bannerNotice.message}</span>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            className="text-xs font-bold uppercase tracking-wider opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Payment Issue Alert */}
      {data?.paymentIssue && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50/90 p-4 text-rose-950 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-200">
          <div className="mt-0.5 text-lg">⚠️</div>
          <div className="flex-1">
            <h4 className="font-bold">Payment Action Required (Grace Period Active)</h4>
            <p className="mt-1 text-xs sm:text-sm">
              Your recent invoice payment attempt was unsuccessful. Your features remain active under a temporary grace period.
              Please update your billing details to avoid service interruption.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsManageModalOpen(true);
                setShowUpdateCard(true);
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
            >
              Update Payment Method
            </button>
          </div>
        </div>
      )}

      {/* Current Subscription Status & Usage Meters */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Current Plan Overview Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Active Tier
              </span>
              <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-0.5 text-xs font-extrabold capitalize text-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
                {currentPlan.name} Plan
              </span>
            </div>
            <h3 className="mt-4 text-3xl font-extrabold text-[var(--text-primary)]">
              ${currentPlan.priceMonthly}
              <span className="text-sm font-normal text-[var(--text-muted)]"> / month</span>
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
              {currentPlan.tagline}
            </p>
          </div>

          <div className="mt-6 border-t border-[var(--border-color)] pt-4 text-xs text-[var(--text-muted)]">
            {data?.renewsAt ? (
              <div className="flex items-center justify-between">
                <span>Renews on:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {new Date(data.renewsAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span>Billing Period:</span>
                <span className="font-semibold text-[var(--text-primary)]">Free Forever</span>
              </div>
            )}
          </div>
        </div>

        {/* Usage Progress Meters */}
        <div className="space-y-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-6 shadow-sm lg:col-span-2">
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Plan Resource Utilization
          </h3>

          {/* Active Jobs Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-primary)]">
                Active Job Postings
              </span>
              <span className="text-[var(--text-muted)]">
                {data?.usage.jobs.current} / {data?.usage.jobs.isUnlimited ? "Unlimited" : data?.usage.jobs.limit}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (data?.usage.jobs.percent || 0) >= 90
                    ? "bg-rose-500"
                    : (data?.usage.jobs.percent || 0) >= 75
                    ? "bg-amber-500"
                    : "bg-indigo-600"
                }`}
                style={{ width: `${Math.min(100, data?.usage.jobs.percent || 0)}%` }}
              />
            </div>
          </div>

          {/* AI Scans Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-primary)]">
                AI Resume Screenings & Scans
              </span>
              <span className="text-[var(--text-muted)]">
                {data?.usage.aiScans.current} / {data?.usage.aiScans.isUnlimited ? "Unlimited" : data?.usage.aiScans.limit}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (data?.usage.aiScans.percent || 0) >= 90
                    ? "bg-rose-500"
                    : (data?.usage.aiScans.percent || 0) >= 75
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, data?.usage.aiScans.percent || 0)}%` }}
              />
            </div>
          </div>

          {/* Team Seats Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-primary)]">
                Recruiter Seats
              </span>
              <span className="text-[var(--text-muted)]">
                {data?.usage.seats.current} / {data?.usage.seats.isUnlimited ? "Unlimited" : data?.usage.seats.limit}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-violet-600 transition-all duration-500"
                style={{ width: `${Math.min(100, data?.usage.seats.percent || 0)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Selection Pricing Cards */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Choose the Right Plan for Your Team
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            All paid tiers include full feature access, anti-cheat assessments, video intro AI transcription, and real-time analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {(["free", "pro", "business"] as PlanKey[]).map((key) => {
            const plan = PLANS[key];
            const isCurrent = currentPlanKey === key;
            const isPopular = key === "pro";

            return (
              <div
                key={key}
                className={`relative flex flex-col justify-between rounded-3xl border p-6 transition-all duration-200 ${
                  isPopular
                    ? "border-violet-500 bg-gradient-to-b from-violet-500/5 to-transparent shadow-xl dark:border-violet-400"
                    : "border-[var(--border-color)] bg-[var(--bg-main)] shadow-sm"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</h3>
                    {isCurrent && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
                    {plan.tagline}
                  </p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[var(--text-primary)]">
                      ${plan.priceMonthly}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">/month</span>
                  </div>

                  {/* Feature Highlights */}
                  <ul className="mt-6 space-y-2.5 border-t border-[var(--border-color)] pt-6 text-xs text-[var(--text-primary)]">
                    {plan.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <svg className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call to Action */}
                <div className="mt-8 pt-4">
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-xl border border-[var(--border-color)] bg-zinc-100 py-2.5 text-xs font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCheckout(key)}
                      disabled={actionLoading === `checkout-${key}`}
                      className={`w-full rounded-xl py-2.5 text-xs font-bold transition-all disabled:opacity-50 ${
                        isPopular
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500"
                          : "border border-violet-600 text-violet-600 hover:bg-violet-50 dark:border-violet-400 dark:text-violet-400 dark:hover:bg-violet-950/40"
                      }`}
                    >
                      {actionLoading === `checkout-${key}` ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Redirecting to Checkout...
                        </span>
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dedicated Billing History & Invoices Section */}
      <div className="space-y-4 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-main)] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
              Billing History & Invoices
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
              Download tax invoices and view transaction receipts for your recruitment subscription.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsManageModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-violet-500 hover:text-violet-600 transition"
          >
            <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Billing Settings
          </button>
        </div>

        {invoicesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-color)] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">No Invoices on File</h4>
            <p className="mt-1 text-xs text-[var(--text-muted)] max-w-md mx-auto">
              {currentPlanKey === "free"
                ? "You are currently enjoying the Free plan. When you upgrade to Pro or Business, your monthly tax receipts and invoices will be cataloged here."
                : "No billing records found for this account. Invoices will automatically appear after billing cycles."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border-color)] bg-zinc-50/50 dark:bg-zinc-900/30 text-[var(--text-muted)] font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-[var(--text-primary)]">
                      {inv.number}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(inv.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-primary)] font-medium">
                      {inv.description}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[var(--text-primary)]">
                      ${inv.amount.toFixed(2)} {inv.currency}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                          inv.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : inv.status === "open"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {inv.status === "paid" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        )}
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-color)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:border-violet-500 hover:text-violet-600 transition"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Receipt
                        </button>
                        {inv.pdfUrl ? (
                          <a
                            href={inv.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-700 transition"
                          >
                            PDF
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setTimeout(() => window.print(), 200);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-color)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                            title="Print invoice"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* In-App Manage Billing & Invoices Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl border border-[var(--border-color)] bg-[var(--bg-main)] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setIsManageModalOpen(false);
                setShowCancelConfirm(false);
                setShowUpdateCard(false);
              }}
              className="absolute top-5 right-5 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Title */}
            <div>
              <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                Manage Subscription & Billing
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)]">
                Review your current subscription terms, payment credentials, and invoices.
              </p>
            </div>

            {/* Plan Info Overview Card */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-zinc-50/50 dark:bg-zinc-900/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Current Plan
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h4 className="text-lg font-bold text-[var(--text-primary)]">
                      {currentPlan.name} Plan
                    </h4>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {data?.status || "active"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[var(--text-primary)]">
                    ${currentPlan.priceMonthly}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]"> / mo</span>
                </div>
              </div>

              <div className="border-t border-[var(--border-color)] pt-3 text-xs flex justify-between items-center text-[var(--text-muted)]">
                <span>Billing Cycle:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {data?.renewsAt
                    ? `Renews on ${new Date(data.renewsAt).toLocaleDateString()}`
                    : "Free Forever"}
                </span>
              </div>
            </div>

            {/* Payment Method Details */}
            <div className="rounded-2xl border border-[var(--border-color)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    Payment Method
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Card on file used for recurring subscription payments.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUpdateCard(!showUpdateCard)}
                  className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-violet-500 hover:text-violet-600 transition"
                >
                  {showUpdateCard ? "Cancel" : "Update Card"}
                </button>
              </div>

              {!showUpdateCard ? (
                <div className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 p-3.5 border border-[var(--border-color)]">
                  <div className="flex h-9 w-12 items-center justify-center rounded-lg bg-zinc-800 text-white font-bold text-xs tracking-wider shadow-inner">
                    CARD
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-[var(--text-primary)]">
                      Primary Visa Card ending in 4242
                    </p>
                    <p className="text-[var(--text-muted)]">
                      Expires 12 / 2028 • Default Payment Method
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Verified
                  </span>
                </div>
              ) : (
                <form onSubmit={handleUpdateCard} className="space-y-3 pt-2">
                  {cardErrorMsg && (
                    <div className="rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-900">
                      {cardErrorMsg}
                    </div>
                  )}
                  {cardSuccessMsg && (
                    <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-2.5 text-xs text-emerald-900">
                      {cardSuccessMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)]">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. Jane Recruiter"
                      className="mt-1 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)]">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                        className="mt-1 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)]">
                        Expires
                      </label>
                      <input
                        type="text"
                        value={expDate}
                        onChange={(e) => setExpDate(e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="mt-1 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCardNumber("4242 4242 4242 4242");
                        setExpDate("12/28");
                        setCvc("123");
                        setCardName("Alex Verified");
                      }}
                      className="text-[11px] text-violet-600 hover:underline"
                    >
                      Fill Test Card
                    </button>
                    <button
                      type="submit"
                      disabled={cardUpdating}
                      className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                    >
                      {cardUpdating ? "Saving..." : "Save Card"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Quick Invoices Summary */}
            <div className="rounded-2xl border border-[var(--border-color)] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    Recent Invoices ({invoices.length})
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Instant access to your billing receipts.
                  </p>
                </div>
                {invoices.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsManageModalOpen(false);
                      const el = document.querySelector("table");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-xs font-semibold text-violet-600 hover:underline"
                  >
                    View All
                  </button>
                )}
              </div>

              {invoices.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">
                  No invoices generated yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {invoices.slice(0, 2).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 p-3 border border-[var(--border-color)] text-xs"
                    >
                      <div>
                        <span className="font-mono font-semibold text-[var(--text-primary)]">
                          {inv.number}
                        </span>
                        <span className="ml-2 text-[var(--text-muted)]">
                          {new Date(inv.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[var(--text-primary)]">
                          ${inv.amount.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsManageModalOpen(false);
                            setSelectedInvoice(inv);
                          }}
                          className="font-semibold text-violet-600 hover:underline"
                        >
                          View Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Plan Cancellation / Downgrade Section */}
            {currentPlanKey !== "free" && (
              <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-5 space-y-3">
                <h4 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                  Cancel Subscription
                </h4>
                <p className="text-xs text-rose-800 dark:text-rose-300/80">
                  Canceling will reset your account to the Free tier immediately and forfeit high-volume AI screenings and multi-seat capabilities.
                </p>

                {!showCancelConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="rounded-xl border border-rose-300 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                  >
                    Cancel Subscription
                  </button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-rose-300 bg-white dark:bg-zinc-900 p-4 text-xs">
                    <p className="font-bold text-rose-700 dark:text-rose-400">
                      Are you sure you want to cancel your {currentPlan.name} plan?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancelSubscription}
                        disabled={isCanceling}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700 transition disabled:opacity-50"
                      >
                        {isCanceling ? "Canceling..." : "Yes, Downgrade to Free"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        Keep My Subscription
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printable Invoice Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl border border-[var(--border-color)] bg-white dark:bg-zinc-950 p-6 sm:p-10 shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto text-zinc-900 dark:text-zinc-100">
            {/* Action Bar (Hidden when printing) */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Tax Invoice / Receipt
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold uppercase text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {selectedInvoice.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-xl bg-violet-600 flex items-center justify-center text-white font-black text-base">
                    AI
                  </div>
                  <span className="text-xl font-extrabold tracking-tight">AI Recruiter Inc.</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Enterprise Recruitment Platform<br />
                  100 Innovation Way, Suite 400<br />
                  San Francisco, CA 94105<br />
                  billing@airecruiter.io
                </p>
              </div>

              <div className="text-left sm:text-right">
                <h2 className="text-2xl font-black tracking-tight text-violet-600">
                  INVOICE
                </h2>
                <p className="mt-1 font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {selectedInvoice.number}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Issue Date:</span>{" "}
                  {new Date(selectedInvoice.date).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Payment Status:</span>{" "}
                  <span className="capitalize font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedInvoice.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Billed To / Recipient Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold uppercase tracking-wider text-zinc-400">Billed To:</span>
                <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {companyInfo?.name || "Subscriber Organization"}
                </p>
                <p className="text-zinc-500">{companyInfo?.email || "billing@subscriber.com"}</p>
                <p className="text-zinc-500">{companyInfo?.location || "United States"}</p>
              </div>

              <div className="sm:text-right">
                <span className="font-bold uppercase tracking-wider text-zinc-400">Payment Summary:</span>
                <p className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">
                  Method: Visa Card ending in 4242
                </p>
                <p className="text-zinc-500">Currency: {selectedInvoice.currency}</p>
              </div>
            </div>

            {/* Itemized Line Items Table */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Item & Description</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <tr>
                    <td className="py-4 px-4">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedInvoice.description}
                      </p>
                      <p className="mt-0.5 text-zinc-500 text-[11px]">
                        Full platform access: AI resume screening, automated proctored tests, recruiter seats, candidate matching.
                      </p>
                    </td>
                    <td className="py-4 px-4 text-center text-zinc-600 dark:text-zinc-400 font-medium">
                      1
                    </td>
                    <td className="py-4 px-4 text-right text-zinc-600 dark:text-zinc-400 font-medium">
                      ${selectedInvoice.amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      ${selectedInvoice.amount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Calculation */}
            <div className="flex justify-end">
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    ${selectedInvoice.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Sales Tax (0%):</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">$0.00</span>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2 flex justify-between text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  <span>Total Paid:</span>
                  <span className="text-violet-600">
                    ${selectedInvoice.amount.toFixed(2)} {selectedInvoice.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 text-center text-[11px] text-zinc-400">
              <p>Thank you for partnering with AI Recruiter. If you have questions about this invoice, contact billing@airecruiter.io.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-zinc-500">
          Loading billing portal...
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
