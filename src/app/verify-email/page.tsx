"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Input } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing from the link.");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok && data.emailVerified) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed. The link may be invalid or expired.");
        }
      } catch {
        setStatus("error");
        setMessage("Network error. Could not verify email.");
      }
    };

    verifyToken();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendError("");
    setResendMessage("");

    if (!resendEmail) {
      setResendError("Please enter your email address.");
      return;
    }

    setResendLoading(true);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResendError(data.error || "Failed to resend verification email.");
      } else {
        setResendMessage(data.message || "Verification email sent!");
      }
    } catch {
      setResendError("Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#1A2233] border border-zinc-200/80 dark:border-zinc-800 shadow-xl transition-all">
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#2E5B8A]/20 dark:border-[#4A7FC1]/20 border-t-[#2E5B8A] dark:border-t-[#4A7FC1] animate-spin" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Verifying your email...
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Please wait while we confirm your email address.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center justify-center py-4 text-center gap-4 animate-fade-slide">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Email Verified!</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
          <PrimaryButton onClick={() => router.push("/")} className="mt-4 py-2.5">
            Proceed to Login
          </PrimaryButton>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col py-2 animate-fade-slide">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Verification Failed
              </h2>
              <p className="text-xs text-red-600 dark:text-red-400">{message}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Need a new link?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Enter your registered email address below to receive a new verification link.
            </p>

            {resendMessage && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{resendMessage}</span>
              </div>
            )}

            {resendError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeLinecap="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                </svg>
                <span>{resendError}</span>
              </div>
            )}

            <form onSubmit={handleResend} className="flex flex-col gap-3">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
              />
              <PrimaryButton type="submit" isLoading={resendLoading}>
                Resend Verification Email
              </PrimaryButton>
            </form>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#FFFFFF] dark:bg-[#0F1420] text-[#1A1A1A] dark:text-[#E5E7EB] relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Suspense fallback={
        <div className="text-center p-6 text-sm text-zinc-500 dark:text-zinc-400">Loading page...</div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
