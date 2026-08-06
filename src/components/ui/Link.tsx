"use client";

import React, { AnchorHTMLAttributes } from "react";

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "accent" | "muted" | "subtle";
  children: React.ReactNode;
}

export function Link({
  children,
  variant = "accent",
  className = "",
  href = "#",
  ...props
}: LinkProps) {
  const variantStyles = {
    accent:
      "text-[#2E5B8A] dark:text-[#4A7FC1] hover:text-[#1F3D5E] dark:hover:text-[#6BA3E8] font-medium",
    muted:
      "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200",
    subtle:
      "text-zinc-500 dark:text-zinc-400 hover:underline",
  };

  return (
    <a
      href={href}
      className={`text-sm transition-colors duration-150 outline-none focus-visible:underline ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
