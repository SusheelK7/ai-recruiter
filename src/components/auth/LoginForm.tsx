"use client";

import React, { useState } from "react";
import { Input } from "../ui/Input";
import { PrimaryButton } from "../ui/PrimaryButton";
import { Link } from "../ui/Link";
import { AuthFormSkeleton } from "./AuthFormSkeleton";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword?: () => void;
}

export function LoginForm({ onSwitchToRegister, onSwitchToForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isUnverified, setIsUnverified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatusMessage, setResendStatusMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsUnverified(false);
    setResendStatusMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Login failed. Please try again.");
        if (res.status === 403 || data.emailVerified === false) {
          setIsUnverified(true);
        }
        setIsLoading(false);
        return;
      }

      // Login successful
      setIsLoading(false);
      alert(`Login successful! Welcome back, ${data.company.name}. Redirecting to dashboard...`);
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setErrorMessage("Please enter your email address to resend verification.");
      return;
    }

    setResendLoading(true);
    setResendStatusMessage("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to resend verification email.");
      } else {
        setResendStatusMessage(data.message || "Verification link sent! Check your inbox.");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  if (isLoading) {
    return <AuthFormSkeleton type="login" />;
  }

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center animate-fade-slide">
      {/* Form Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome back
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Enter your credentials to access your account
        </p>
      </div>

      {/* Distinct Unverified Email Warning Alert */}
      {isUnverified ? (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendLoading}
            className="self-start text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white transition-colors disabled:opacity-50"
          >
            {resendLoading ? "Sending link..." : "Resend verification email"}
          </button>
        </div>
      ) : (
        /* Standard Global Form Error Alert */
        errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )
      )}

      {/* Resend Status Notification */}
      {resendStatusMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{resendStatusMessage}</span>
          </div>
        </div>
      )}

      {/* Form Body */}
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

        <div className="flex flex-col">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
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
                    // Eye Off Icon
                    <svg className="w-4 h-4 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.007 10.007 0 013.68-.813c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    // Eye Icon
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
          <div className="flex justify-end mt-1.5">
            <Link
              href="#forgot-password"
              variant="accent"
              onClick={(e) => {
                e.preventDefault();
                if (onSwitchToForgotPassword) {
                  onSwitchToForgotPassword();
                }
              }}
              className="text-xs"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <PrimaryButton type="submit" isLoading={isLoading} className="mt-2 py-2.5">
          Log In
        </PrimaryButton>
      </form>

      {/* Footer Switch Tab */}
      <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-[#2E5B8A] dark:text-[#4A7FC1] hover:underline focus:outline-none transition-colors"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}
