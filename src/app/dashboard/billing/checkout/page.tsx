"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPlan, type PlanKey } from "@/lib/plans";

function CheckoutPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const planKey = (searchParams.get("plan") || "pro").toLowerCase() as PlanKey;
  const plan = getPlan(planKey);

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(" ") : digits;
  };

  const formatExpDate = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)} / ${digits.slice(2, 4)}`;
    }
    return digits;
  };

  const fillTestCard = (type: "success" | "declined") => {
    setCardName("Alex Recruiter");
    if (type === "success") {
      setCardNumber("4242 4242 4242 4242");
    } else {
      setCardNumber("4000 0000 0000 0002");
    }
    setExpDate("12 / 28");
    setCvc("123");
    setPostalCode("94103");
    setError(null);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cardNumber || !expDate || !cvc) {
      setError("Please complete all payment card fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/billing/mock-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.key,
          cardName: cardName || "Verified Cardholder",
          cardNumber,
          expDate,
          cvc,
          postalCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment was rejected. Please check your card.");
      }

      // Success redirect
      router.push(`/dashboard/billing?success=true&plan=${plan.key}`);
    } catch (err: any) {
      setError(err.message || "An error occurred while processing your payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      {/* Header Back Link */}
      <div className="mb-6">
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Subscription Overview
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
        {/* Left Column: Order Summary */}
        <div className="space-y-6 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-main)] p-6 shadow-sm md:col-span-2">
          <div>
            <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-0.5 text-xs font-extrabold text-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
              Checkout
            </span>
            <h2 className="mt-3 text-xl font-bold text-[var(--text-primary)]">
              {plan.name} Subscription
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
              {plan.tagline}
            </p>
          </div>

          <div className="border-t border-b border-[var(--border-color)] py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">Billed Monthly</span>
              <span className="text-2xl font-black text-[var(--text-primary)]">
                ${plan.priceMonthly}
                <span className="text-xs font-normal text-[var(--text-muted)]">.00</span>
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Included Features
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-[var(--text-primary)]">
              {plan.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <svg className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-200/60 bg-zinc-50/50 p-3 text-[11px] text-[var(--text-muted)] dark:border-zinc-800 dark:bg-zinc-900/40">
            🔒 256-bit encrypted test transaction. You can cancel or change your plan at any time.
          </div>
        </div>

        {/* Right Column: Payment Form */}
        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-main)] p-6 shadow-sm md:col-span-3">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Credit or Debit Card
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span>💳 Visa / Mastercard / Amex</span>
            </div>
          </div>

          {/* Test Card Quick Helper */}
          <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/70 p-3.5 text-xs text-violet-950 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-200">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <span>⚡</span> Test Mode Simulator
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fillTestCard("success")}
                  className="rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-violet-700 transition"
                >
                  Fill Valid Card
                </button>
                <button
                  type="button"
                  onClick={() => fillTestCard("declined")}
                  className="rounded-lg border border-violet-300 bg-white px-2 py-1 text-[11px] font-semibold text-violet-800 hover:bg-violet-100 transition dark:border-violet-800 dark:bg-zinc-900 dark:text-violet-300"
                >
                  Fill Declined Card
                </button>
              </div>
            </div>
            <p className="mt-1 text-[11px] opacity-80">
              Click &ldquo;Fill Valid Card&rdquo; to populate standard test card numbers or type your own test details.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Card Form */}
          <form onSubmit={handleSubmitPayment} className="mt-6 space-y-4 text-xs">
            {/* Name on Card */}
            <div>
              <label className="block font-semibold text-[var(--text-primary)] mb-1">
                Name on Card
              </label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* Card Number */}
            <div>
              <label className="block font-semibold text-[var(--text-primary)] mb-1">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] font-mono focus:border-violet-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-zinc-400">💳</span>
              </div>
            </div>

            {/* Exp Date & CVC */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[var(--text-primary)] mb-1">
                  Expiration Date
                </label>
                <input
                  type="text"
                  placeholder="MM / YY"
                  value={expDate}
                  onChange={(e) => setExpDate(formatExpDate(e.target.value))}
                  maxLength={7}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] font-mono focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-primary)] mb-1">
                  CVC / Security Code
                </label>
                <input
                  type="password"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  maxLength={4}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] font-mono focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Postal Code */}
            <div>
              <label className="block font-semibold text-[var(--text-primary)] mb-1">
                Billing ZIP / Postal Code
              </label>
              <input
                type="text"
                placeholder="90210"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Authorizing Card & Activating Subscription...
                  </span>
                ) : (
                  `Pay $${plan.priceMonthly}.00 & Upgrade to ${plan.name}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-zinc-500">
          Loading checkout portal...
        </div>
      }
    >
      <CheckoutPaymentContent />
    </Suspense>
  );
}
