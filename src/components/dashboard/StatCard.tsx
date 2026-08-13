"use client";

import React from "react";
import { CountUp } from "@/components/dashboard/CountUp";

interface StatCardProps {
  title: string;
  value: number;
  trend: number;
  trendLabel?: string;
  icon: React.ReactNode;
  accentClass: string;
}

function formatTrend(trend: number, label?: string) {
  const prefix = trend > 0 ? "+" : "";
  const suffix = label ?? "this week";
  return `${prefix}${trend} ${suffix}`;
}

export function StatCard({ title, value, trend, trendLabel, icon, accentClass }: StatCardProps) {
  return (
    <div className="dashboard-card rounded-2xl p-4 transition-colors duration-300 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--text-muted)]">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            <CountUp value={value} />
          </p>
          <p
            className={`mt-1.5 text-xs font-medium ${
              trend >= 0 ? "text-[var(--success-color)]" : "text-[var(--error-color)]"
            }`}
          >
            {formatTrend(trend, trendLabel)}
          </p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
