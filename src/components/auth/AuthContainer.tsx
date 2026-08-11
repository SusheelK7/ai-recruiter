"use client";

import React, { useState, useEffect } from "react";
import { AuthIllustration } from "./AuthIllustration";
import { LoginForm } from "./LoginForm";
import { RegistrationForm } from "./RegistrationForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { AuthFormSkeleton } from "./AuthFormSkeleton";
import { PublicNavbar } from "../layout/PublicNavbar";

type AuthTab = "login" | "register" | "forgot-password";

interface AuthContainerProps {
  initialTab?: AuthTab;
}

export function AuthContainer({ initialTab = "login" }: AuthContainerProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Brief initial load simulation for skeleton demonstration & smooth entrance
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row bg-[#FFFFFF] dark:bg-[#0F1420] text-[#1A1A1A] dark:text-[#E5E7EB] transition-colors duration-300">
      <PublicNavbar />

      {/* LEFT COLUMN: ~45% Width Illustration Panel */}
      <div className="hidden lg:block lg:w-[45%] xl:w-[42%] min-h-screen sticky top-0">
        <AuthIllustration />
      </div>

      {/* RIGHT COLUMN: ~55% Width Auth Form Container */}
      <div className="flex-1 min-h-screen relative flex flex-col justify-between p-4 sm:p-8 lg:p-14 pt-28 sm:pt-32 lg:pt-36 bg-[#FFFFFF] dark:bg-[#0F1420] transition-colors duration-300">
        {/* Centered Auth Card */}
        <div className="my-auto py-4 sm:py-6 flex items-center justify-center w-full">
          <div className="w-full max-w-md p-5 sm:p-8 rounded-2xl bg-white dark:bg-[#1A2233] sm:shadow-lg sm:dark:shadow-2xl/40 sm:border border-zinc-200/60 dark:border-zinc-800/80 transition-all duration-300">
            {/* MOBILE ONLY: Full-Width Segmented Tab Switcher above form heading */}
            <div className="flex sm:hidden p-1 mb-6 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 w-full items-center text-xs transition-colors duration-300">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-center transition-all duration-200 active:scale-[0.98] ${
                  activeTab === "login"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-center transition-all duration-200 active:scale-[0.98] ${
                  activeTab === "register"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form component with soft cross-fade slide transition or skeleton */}
            {isInitialLoading ? (
              <AuthFormSkeleton type={activeTab === "forgot-password" ? "login" : activeTab} />
            ) : (
              <div key={activeTab} className="animate-fade-slide w-full">
                {activeTab === "login" ? (
                  <LoginForm
                    onSwitchToRegister={() => setActiveTab("register")}
                    onSwitchToForgotPassword={() => setActiveTab("forgot-password")}
                  />
                ) : activeTab === "register" ? (
                  <RegistrationForm onSwitchToLogin={() => setActiveTab("login")} />
                ) : (
                  <ForgotPasswordForm onSwitchToLogin={() => setActiveTab("login")} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 py-2 transition-colors duration-300">
          Protected by enterprise grade 256-bit encryption • AI Recruiter Platform
        </div>
      </div>
    </div>
  );
}
