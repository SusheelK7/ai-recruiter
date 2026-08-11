"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Input } from "@/components/ui/Input";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ValidationChecklist, validatePasswordRules, isPasswordValid } from "@/components/ui/ValidationChecklist";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordStarted, setIsPasswordStarted] = useState(false);

  const [isValidating, setIsValidating] = useState(true);
  const [tokenError, setTokenError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      setTokenError("Password reset token is missing from the link.");
      return;
    }

    // Validate token status on page load
    const validateToken = async () => {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok) {
          setTokenError(data.error || "Invalid or expired password reset token.");
        }
      } catch {
        setTokenError("Network error validating reset token.");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const passwordRules = validatePasswordRules(password);
  const allRulesPassed = isPasswordValid(passwordRules);
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const isFormValid = allRulesPassed && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!isFormValid || !token) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to reset password. Please try again.");
      } else {
        setIsSuccess(true);
      }
    } catch {
      setSubmitError("Network error while setting new password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#2E5B8A]/20 dark:border-[#4A7FC1]/20 border-t-[#2E5B8A] dark:border-t-[#4A7FC1] animate-spin" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Validating reset token...</p>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#1A2233] border border-zinc-200/80 dark:border-zinc-800 shadow-xl animate-fade-slide">
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
              Reset Link Invalid
            </h2>
            <p className="text-xs text-red-600 dark:text-red-400">{tokenError}</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <PrimaryButton onClick={() => router.push("/")} className="py-2.5">
            Back to Login
          </PrimaryButton>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#1A2233] border border-zinc-200/80 dark:border-zinc-800 shadow-xl text-center animate-fade-slide flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Password Reset Complete</h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Your password has been successfully updated. You can now log in with your new password.
        </p>
        <PrimaryButton onClick={() => router.push("/")} className="mt-2 py-2.5">
          Proceed to Login
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#1A2233] border border-zinc-200/80 dark:border-zinc-800 shadow-xl animate-fade-slide">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Set New Password
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Create a strong, unique password to secure your account
        </p>
      </div>

      {submitError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
          </svg>
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Input
            label="New Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (!isPasswordStarted && e.target.value.length > 0) {
                setIsPasswordStarted(true);
              }
            }}
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.007 10.007 0 013.68-.813c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            }
          />

          <ValidationChecklist password={password} isVisible={isPasswordStarted} />
        </div>

        <Input
          label="Confirm New Password"
          type={showPassword ? "text" : "password"}
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmPassword.length > 0 && confirmPassword !== password ? "Passwords do not match" : undefined}
          required
        />

        <PrimaryButton type="submit" disabled={!isFormValid} isLoading={isSubmitting} className="mt-2 py-2.5">
          Update Password
        </PrimaryButton>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full bg-[#FFFFFF] text-[#1A1A1A] dark:bg-[#0F1420] dark:text-[#E5E7EB] relative pt-28 pb-10 px-4 sm:px-6">
      <PublicNavbar />
      <Suspense fallback={
        <div className="text-center p-6 text-sm text-zinc-500 dark:text-zinc-400">Loading page...</div>
      }>
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <ResetPasswordContent />
        </div>
      </Suspense>
    </div>
  );
}
