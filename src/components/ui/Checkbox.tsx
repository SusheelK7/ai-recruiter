"use client";

import React, { forwardRef, InputHTMLAttributes } from "react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  containerClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, containerClassName = "", className = "", id, ...props }, ref) => {
    const checkboxId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <label
        htmlFor={checkboxId}
        className={`inline-flex items-start gap-2.5 cursor-pointer select-none text-sm text-zinc-600 dark:text-zinc-300 ${containerClassName}`}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            className={`
              peer appearance-none h-4 w-4 rounded border transition-all cursor-pointer
              bg-white dark:bg-[#1A2233]
              border-zinc-300 dark:border-zinc-600
              checked:bg-[#2E5B8A] dark:checked:bg-[#4A7FC1]
              checked:border-[#2E5B8A] dark:checked:border-[#4A7FC1]
              focus:ring-2 focus:ring-[#2E5B8A]/20 dark:focus:ring-[#4A7FC1]/20 outline-none
              ${className}
            `}
            {...props}
          />
          <svg
            className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        {label && <span className="leading-tight">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
