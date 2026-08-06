"use client";

import React, { useState } from "react";
import { Input } from "../ui/Input";
import { PrimaryButton } from "../ui/PrimaryButton";
import { Link } from "../ui/Link";
import { AuthFormSkeleton } from "./AuthFormSkeleton";

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    // Simulate authentication call
    setTimeout(() => {
      setIsLoading(false);
      // Demo validation check
      if (email.includes("@") && password.length >= 6) {
        alert("Login successful! Redirecting to AI Recruiter dashboard...");
      } else {
        setErrorMessage("Invalid email or password.");
      }
    }, 1200);
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

      {/* Global Form Error Alert if any */}
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
                alert("Password reset instructions sent if email exists.");
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
