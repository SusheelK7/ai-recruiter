"use client";

import React, { forwardRef, InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      rightElement,
      containerClassName = "",
      className = "",
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 uppercase"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`
              w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all duration-200 ease-out outline-none
              bg-white dark:bg-[#1A2233] 
              text-zinc-900 dark:text-zinc-100 
              placeholder:text-zinc-400 dark:placeholder:text-zinc-500
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                error
                  ? "border-red-600 dark:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-zinc-200 dark:border-zinc-700/80 focus:border-[#2E5B8A] dark:focus:border-[#4A7FC1] focus:ring-2 focus:ring-[#2E5B8A]/20 dark:focus:ring-[#4A7FC1]/25"
              }
              ${rightElement ? "pr-10" : ""}
              ${className}
            `}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center justify-center text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path strokeLinecap="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
            </svg>
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
