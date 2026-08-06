"use client";

import React from "react";
import { useTheme } from "../theme/ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={`
        inline-flex items-center justify-center p-2 rounded-full border transition-all duration-200 shadow-xs
        bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md
        border-zinc-200 dark:border-zinc-700
        text-zinc-700 dark:text-zinc-200
        hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:scale-105 active:scale-90
        focus:outline-none focus:ring-2 focus:ring-[#2E5B8A] dark:focus:ring-[#4A7FC1]
        ${className}
      `}
    >
      {theme === "light" ? (
        <svg
          className="w-4 h-4 text-amber-500 fill-amber-500/20 transition-transform duration-300 rotate-0 hover:rotate-12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      ) : (
        <svg
          className="w-4 h-4 text-amber-400 fill-amber-400/20 transition-transform duration-300 rotate-0 hover:rotate-45"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      )}
    </button>
  );
}
