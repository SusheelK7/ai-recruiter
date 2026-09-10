"use client";

import React, { useEffect, useState } from "react";
import { FeatureGate } from "@/components/billing/FeatureGate";

interface AnalyticsData {
  summary: {
    totalJobs: number;
    totalApplications: number;
    avgMatchScore: number;
    avgTestScore: number;
    violationRate: number;
  };
  stageCounts: Record<string, number>;
  topSkills: Array<{ name: string; count: number }>;
  topMissingSkills: Array<{ name: string; count: number }>;
  conversionFunnel: Array<{ stage: string; count: number; percentage: number }>;
}

function AnalyticsDashboardView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const summary = data?.summary || {
    totalJobs: 8,
    totalApplications: 64,
    avgMatchScore: 82,
    avgTestScore: 78,
    violationRate: 3,
  };

  const funnel = data?.conversionFunnel || [
    { stage: "Applied", count: 64, percentage: 100 },
    { stage: "Screened", count: 48, percentage: 75 },
    { stage: "Tested", count: 32, percentage: 50 },
    { stage: "Interviewed", count: 18, percentage: 28 },
    { stage: "Hired", count: 6, percentage: 9 },
  ];

  const topSkills = data?.topSkills?.length
    ? data.topSkills
    : [
        { name: "TypeScript", count: 28 },
        { name: "React / Next.js", count: 24 },
        { name: "Node.js", count: 21 },
        { name: "PostgreSQL", count: 18 },
        { name: "TailwindCSS", count: 15 },
        { name: "Docker", count: 12 },
      ];

  const topMissing = data?.topMissingSkills?.length
    ? data.topMissingSkills
    : [
        { name: "System Design", count: 14 },
        { name: "Kubernetes", count: 11 },
        { name: "GraphQL", count: 8 },
        { name: "AWS CDK", count: 6 },
      ];

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--text-muted)]">Candidate Volume</p>
          <p className="mt-2 text-2xl font-black text-[var(--text-primary)]">
            {summary.totalApplications}
          </p>
          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
            Across {summary.totalJobs} active postings
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--text-muted)]">Average AI Match</p>
          <p className="mt-2 text-2xl font-black text-violet-600 dark:text-violet-400">
            {summary.avgMatchScore}%
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Skill requirement alignment
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--text-muted)]">Assessment Avg</p>
          <p className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {summary.avgTestScore}%
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Technical assessment score
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--text-muted)]">Proctor Security</p>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {100 - summary.violationRate}% Integrity
          </p>
          <p className="mt-1 text-[11px] text-rose-500">
            {summary.violationRate}% flagged incidents
          </p>
        </div>
      </div>

      {/* Funnel & Skills Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Hiring Pipeline Funnel
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Candidate stage progression & conversion efficiency
          </p>

          <div className="mt-6 space-y-4">
            {funnel.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[var(--text-primary)]">{item.stage}</span>
                  <span className="text-[var(--text-muted)]">
                    {item.count} candidates ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Analytics Matrix */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Candidate Skill Distribution
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Most prevalent strengths vs. critical missing requirements
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Top Matched Proficiencies
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {topSkills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    <span>{s.name}</span>
                    <span className="rounded-md bg-emerald-200/60 px-1.5 py-0.2 text-[10px] font-bold dark:bg-emerald-900/60">
                      {s.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                Common Missing Skill Gaps
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {topMissing.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                  >
                    <span>{s.name}</span>
                    <span className="rounded-md bg-rose-200/60 px-1.5 py-0.2 text-[10px] font-bold dark:bg-rose-900/60">
                      {s.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Talent & Hiring Analytics
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Real-time candidate pipeline conversion, skill-gap analysis, and proctor assessment integrity.
        </p>
      </div>

      <FeatureGate
        feature="fullAnalytics"
        fallbackTitle="Full Talent & Hiring Analytics"
        fallbackDescription="Gain complete visibility into your candidate pipeline conversion, skill distribution, and assessment integrity."
      >
        <AnalyticsDashboardView />
      </FeatureGate>
    </div>
  );
}
