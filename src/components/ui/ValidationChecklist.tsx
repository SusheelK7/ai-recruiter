"use client";

import React from "react";

export interface PasswordRules {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function validatePasswordRules(password: string): PasswordRules {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}

export function isPasswordValid(rules: PasswordRules): boolean {
  return (
    rules.minLength &&
    rules.hasUppercase &&
    rules.hasLowercase &&
    rules.hasNumber &&
    rules.hasSpecial
  );
}

interface ValidationChecklistProps {
  password: string;
  isVisible?: boolean;
}

export function ValidationChecklist({ password, isVisible = true }: ValidationChecklistProps) {
  if (!isVisible) return null;

  const rules = validatePasswordRules(password);

  const ruleItems = [
    { label: "At least 8 characters", satisfied: rules.minLength },
    { label: "At least one uppercase letter", satisfied: rules.hasUppercase },
    { label: "At least one lowercase letter", satisfied: rules.hasLowercase },
    { label: "At least one number", satisfied: rules.hasNumber },
    { label: "At least one special character", satisfied: rules.hasSpecial },
  ];

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-zinc-50 dark:bg-[#151C2A] border border-zinc-200/80 dark:border-zinc-800 text-xs transition-all duration-200">
      <span className="font-semibold text-zinc-500 dark:text-zinc-400 mb-0.5">
        Password Requirements:
      </span>
      {ruleItems.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 transition-colors duration-150">
          <div
            className={`
              w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] transition-all duration-200
              ${
                item.satisfied
                  ? "bg-emerald-500 text-white dark:bg-emerald-500"
                  : "bg-zinc-200 text-zinc-400 dark:bg-zinc-700/80 dark:text-zinc-500"
              }
            `}
          >
            {item.satisfied ? (
              <svg
                className="w-2.5 h-2.5 stroke-[3]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
            )}
          </div>
          <span
            className={`transition-colors duration-150 ${
              item.satisfied
                ? "text-emerald-700 dark:text-emerald-400 font-medium"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
