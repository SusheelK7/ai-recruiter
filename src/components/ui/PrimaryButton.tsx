"use client";

import React, { ButtonHTMLAttributes } from "react";

export interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function PrimaryButton({
  children,
  isLoading = false,
  fullWidth = true,
  disabled,
  className = "",
  type = "submit",
  ...props
}: PrimaryButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`
        relative inline-flex items-center justify-center font-medium text-sm px-5 py-2.5 rounded-lg
        transition-all duration-200 ease-out shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2
        bg-[#2E5B8A] hover:bg-[#23486E] active:bg-[#1C3A5A] text-white active:scale-[0.98]
        dark:bg-[#4A7FC1] dark:hover:bg-[#3B6EB0] dark:active:bg-[#2F5C97] dark:text-white
        focus:ring-[#2E5B8A] dark:focus:ring-[#4A7FC1] dark:focus:ring-offset-[#0F1420]
        disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100
        dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
