"use client";

import React from "react";
import { useDashboard } from "@/components/dashboard/DashboardProvider";

export function MobileMenuButton() {
  const { setMobileOpen } = useDashboard();

  return (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      aria-label="Open navigation menu"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card)] lg:hidden"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
