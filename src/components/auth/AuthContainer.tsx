"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { AuthIllustration } from "./AuthIllustration";
import { LoginForm } from "./LoginForm";
import { RegistrationForm } from "./RegistrationForm";
import { ThemeToggle } from "../ui/ThemeToggle";
import { AuthFormSkeleton } from "./AuthFormSkeleton";

export function AuthContainer() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Brief initial load simulation for skeleton demonstration & smooth entrance
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FFFFFF] dark:bg-[#0F1420] text-[#1A1A1A] dark:text-[#E5E7EB] transition-colors duration-300">
      {/* LEFT COLUMN: ~45% Width Illustration Panel */}
      <div className="hidden lg:block lg:w-[45%] xl:w-[42%] min-h-screen sticky top-0">
        <AuthIllustration />
      </div>

      {/* RIGHT COLUMN: ~55% Width Auth Form Container */}
      <div className="flex-1 min-h-screen relative flex flex-col justify-between p-4 sm:p-10 lg:p-14 bg-[#FFFFFF] dark:bg-[#0F1420] transition-colors duration-300">
        {/* Top Header Row with Mobile Brand Badge & Theme Toggle */}
        <div className="w-full flex items-center justify-between z-20 mb-6 sm:mb-8">
          {/* Mobile Logo Brand Header (visible on mobile < sm) */}
          <div className="flex sm:hidden items-center">
            <div className="p-1.5 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs flex items-center justify-center">
              <Image
                src="/mobile-icon.png"
                alt="AI Recruiter Icon"
                width={32}
                height={32}
                className="w-7 h-7 object-contain"
                priority
              />
            </div>
          </div>

          {/* Tablet Brand Logo Header (visible on sm:flex, hidden on lg where left panel exists) */}
          <div className="hidden sm:flex lg:hidden items-center">
            <div className="p-2 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs flex items-center justify-center">
              <Image
                src="/web-logo.png"
                alt="AI Recruiter Logo"
                width={130}
                height={32}
                className="h-6.5 w-auto object-contain"
                priority
              />
            </div>
          </div>

          {/* Tab Pill Switcher & Theme Toggle in top right */}
          <div className="ml-auto flex items-center gap-3">
            {/* Desktop / Tablet Tab Switcher (sm:flex, hidden on mobile) */}
            <div className="hidden sm:flex p-1 rounded-xl bg-zinc-100 dark:bg-[#1A2233] border border-zinc-200/80 dark:border-zinc-800 items-center text-xs transition-colors duration-300">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition-all duration-200 active:scale-[0.98] ${
                  activeTab === "login"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition-all duration-200 active:scale-[0.98] ${
                  activeTab === "register"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                Sign Up
              </button>
            </div>

            <ThemeToggle />
          </div>
        </div>

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
              <AuthFormSkeleton type={activeTab} />
            ) : (
              <div key={activeTab} className="animate-fade-slide w-full">
                {activeTab === "login" ? (
                  <LoginForm onSwitchToRegister={() => setActiveTab("register")} />
                ) : (
                  <RegistrationForm onSwitchToLogin={() => setActiveTab("login")} />
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
