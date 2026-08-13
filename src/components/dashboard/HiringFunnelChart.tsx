"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { FunnelPoint } from "@/components/dashboard/types";

interface HiringFunnelChartProps {
  data: FunnelPoint[];
}

const STAGE_COLORS_LIGHT = ["#2E5B8A", "#3A6D9E", "#467FB2", "#5291C6", "#5EA3DA"];
const STAGE_COLORS_DARK = ["#4A7FC1", "#5B8ED0", "#6C9DDF", "#7DACED", "#8EBBFB"];

export function HiringFunnelChart({ data }: HiringFunnelChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const colors = isDark ? STAGE_COLORS_DARK : STAGE_COLORS_LIGHT;
  const gridColor = isDark ? "#2D3748" : "#E2E8F0";
  const textColor = isDark ? "#9CA3AF" : "#64748B";

  return (
    <div className="dashboard-card rounded-2xl p-4 transition-colors duration-300 sm:p-5">
      <h3 className="text-base font-semibold text-[var(--text-primary)]">Hiring Funnel</h3>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Applied → Hired pipeline</p>
      <div className="mt-4 h-52 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: textColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="stage"
              width={72}
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
              cursor={{ fill: isDark ? "rgba(74,127,193,0.08)" : "rgba(46,91,138,0.06)" }}
            />
            <Bar
              dataKey="count"
              radius={[0, 8, 8, 0]}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={entry.stage} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
