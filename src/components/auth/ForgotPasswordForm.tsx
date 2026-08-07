"use client";

import React, { useState } from "react";
import { Input } from "../ui/Input";
import { PrimaryButton } from "../ui/PrimaryButton";

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

export function ForgotPasswordForm({ onSwitchToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setDevResetUrl("");

    if (!email) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to process forgot password request.");
      } else {
        setSuccessMessage(
          data.message || "If an account exists with this email, a reset link has been sent."
        );
        if (data.resetUrl) {
          setDevResetUrl(data.resetUrl);
        }
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center animate-fade-slide">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Reset password
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Enter your account email to receive a password reset link
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex flex-col gap-2">
          <div className="flex items-start gap-2.5">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>

          {devResetUrl && (
            <div className="mt-1 pt-2 border-t border-emerald-200 dark:border-emerald-800/80 flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
                Local Dev Reset Link:
              </span>
              <a
                href={devResetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold underline text-[#2E5B8A] dark:text-[#4A7FC1] hover:text-blue-600 dark:hover:text-blue-400 break-all"
              >
                Click here to reset password directly →
              </a>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email address"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <PrimaryButton type="submit" isLoading={isLoading} className="mt-2 py-2.5">
          Send Reset Link
        </PrimaryButton>
      </form>

      <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Remember your password?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-[#2E5B8A] dark:text-[#4A7FC1] hover:underline focus:outline-none transition-colors"
        >
          Log in
        </button>
      </div>
    </div>
  );
}
