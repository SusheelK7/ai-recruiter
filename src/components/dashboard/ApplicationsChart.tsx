"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { TimeSeriesPoint } from "@/components/dashboard/types";

interface ApplicationsChartProps {
  data: TimeSeriesPoint[];
}

export function ApplicationsChart({ data }: ApplicationsChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const accent = isDark ? "#4A7FC1" : "#2E5B8A";
  const gridColor = isDark ? "#2D3748" : "#E2E8F0";
  const textColor = isDark ? "#9CA3AF" : "#64748B";

  return (
    <div className="dashboard-card rounded-2xl p-4 transition-colors duration-300 sm:p-5">
      <h3 className="text-base font-semibold text-[var(--text-primary)]">Applications Over Time</h3>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Last 30 days</p>
      <div className="mt-4 h-52 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="applicationsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: textColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: textColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#1A2233" : "#FFFFFF",
                border: `1px solid ${gridColor}`,
                borderRadius: "12px",
                color: isDark ? "#E5E7EB" : "#1A1A1A",
              }}
              labelStyle={{ color: textColor }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={accent}
              strokeWidth={2.5}
              fill="url(#applicationsGradient)"
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
