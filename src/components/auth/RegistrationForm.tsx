"use client";

import React, { useState } from "react";
import { Input } from "../ui/Input";
import { PrimaryButton } from "../ui/PrimaryButton";
import { Checkbox } from "../ui/Checkbox";
import { Link } from "../ui/Link";
import {
  ValidationChecklist,
  validatePasswordRules,
  isPasswordValid,
} from "../ui/ValidationChecklist";
import { AuthFormSkeleton } from "./AuthFormSkeleton";

interface RegistrationFormProps {
  onSwitchToLogin: () => void;
}

export function RegistrationForm({ onSwitchToLogin }: RegistrationFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isPasswordStarted, setIsPasswordStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const passwordRules = validatePasswordRules(password);
  const allPasswordRulesPassed = isPasswordValid(passwordRules);

  const isConfirmError = confirmPassword.length > 0 && confirmPassword !== password;

  const isFormValid =
    companyName.trim().length > 0 &&
    email.includes("@") &&
    allPasswordRulesPassed &&
    confirmPassword.length > 0 &&
    confirmPassword === password &&
    termsAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!isFormValid) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message || "Account created successfully! Check your email to verify your account before logging in.");
      setIsLoading(false);

      setTimeout(() => {
        onSwitchToLogin();
      }, 3000);
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <AuthFormSkeleton type="register" />;
  }


  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center animate-fade-slide">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create your account
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Start hiring top talent faster with AI power
        </p>
      </div>

      {/* Error Message */}
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

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>

        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <Input
          label="Company name"
          type="text"
          placeholder="Acme Corp"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />

        <Input
          label="Work Email"
          type="email"
          placeholder="alex@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <div className="flex flex-col gap-2">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (!isPasswordStarted && e.target.value.length > 0) {
                setIsPasswordStarted(true);
              }
            }}
            autoComplete="new-password"
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all duration-200 ease-out hover:scale-110 active:scale-95 focus:outline-none"
              >
                <div className="transition-transform duration-200 ease-out transform">
                  {showPassword ? (
                    <svg className="w-4 h-4 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.007 10.007 0 013.68-.813c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </div>
              </button>
            }
          />

          {/* Live Password Requirements Checklist (appears when user starts typing) */}
          <ValidationChecklist password={password} isVisible={isPasswordStarted} />
        </div>

        <Input
          label="Confirm Password"
          type={showPassword ? "text" : "password"}
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={isConfirmError ? "Passwords do not match" : undefined}
          autoComplete="new-password"
          required
        />

        <Checkbox
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          containerClassName="mt-1"
          label={
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              I agree to the{" "}
              <Link
                href="#terms"
                onClick={(e) => e.preventDefault()}
                variant="accent"
                className="text-xs"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="#privacy"
                onClick={(e) => e.preventDefault()}
                variant="accent"
                className="text-xs"
              >
                Privacy Policy
              </Link>
            </span>
          }
        />

        <PrimaryButton
          type="submit"
          disabled={!isFormValid}
          isLoading={isLoading}
          className="mt-2 py-2.5"
        >
          Create Account
        </PrimaryButton>
      </form>

      {/* Switch Tab Link */}
      <div className="mt-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
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
