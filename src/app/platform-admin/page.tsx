"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface OverviewMetrics {
  totalCompanies: number;
  signupsThisWeek: number;
  signupsThisMonth: number;
  mrr: number;
  planCounts: {
    free: number;
    pro: number;
    business: number;
  };
  totalApplications: number;
  totalAiCostThisMonth: number;
  aiEventsThisMonth: number;
  paymentIssuesCount: number;
}

interface OverviewData {
  metrics: OverviewMetrics;
  mrrHistory: { month: string; mrr: number }[];
  recentCompanies: any[];
  recentAuditLogs: any[];
}

export default function PlatformAdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/platform-admin/overview");
      if (!res.ok) throw new Error("Failed to load overview data");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Error loading overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-zinc-400">Loading platform metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error || "Failed to load overview."}
        </div>
      </div>
    );
  }

  const { metrics, mrrHistory, recentCompanies, recentAuditLogs } = data;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Platform Command Center</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Production
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Global metrics, subscription performance, and Gemini AI operations across all tenants.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOverview}
            className="px-3.5 py-1.5 rounded-lg bg-[#121927] hover:bg-[#1a2337] border border-[#1e293b] text-zinc-300 text-xs font-medium transition-all flex items-center space-x-2 cursor-pointer"
          >
            <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Companies */}
        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b] relative overflow-hidden">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Total Companies</div>
          <div className="text-2xl font-bold text-white mt-1.5 tracking-tight">{metrics.totalCompanies}</div>
          <div className="mt-3 flex items-center space-x-2 text-[11px] text-zinc-400">
            <span className="text-emerald-400 font-semibold">+{metrics.signupsThisWeek}</span>
            <span>this week</span>
            <span className="text-zinc-600">•</span>
            <span className="text-indigo-400">+{metrics.signupsThisMonth}</span>
            <span>month</span>
          </div>
        </div>

        {/* Total MRR */}
        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b] relative overflow-hidden">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Total MRR</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1.5 tracking-tight">${metrics.mrr.toLocaleString()}</div>
          <div className="mt-3 text-[11px] text-zinc-400 truncate">
            {metrics.planCounts.pro} Pro ($79) • {metrics.planCounts.business} Business ($249)
          </div>
        </div>

        {/* Total Applications Processed */}
        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b] relative overflow-hidden">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Applications Handled</div>
          <div className="text-2xl font-bold text-white mt-1.5 tracking-tight">{metrics.totalApplications.toLocaleString()}</div>
          <div className="mt-3 text-[11px] text-zinc-400">
            Platform-wide candidate funnel
          </div>
        </div>

        {/* Total AI Cost This Month */}
        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b] relative overflow-hidden">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">AI Cost (This Month)</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1.5 tracking-tight">${metrics.totalAiCostThisMonth.toFixed(2)}</div>
          <div className="mt-3 text-[11px] text-zinc-400">
            {metrics.aiEventsThisMonth.toLocaleString()} Gemini operations
          </div>
        </div>

        {/* Payment Issues */}
        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b] relative overflow-hidden">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Payment Flags</div>
          <div className={`text-2xl font-bold mt-1.5 tracking-tight ${metrics.paymentIssuesCount > 0 ? "text-amber-400" : "text-zinc-400"}`}>
            {metrics.paymentIssuesCount}
          </div>
          <div className="mt-3 text-[11px] text-zinc-400">
            {metrics.paymentIssuesCount > 0 ? (
              <span className="text-amber-400 font-medium">Requires billing intervention</span>
            ) : (
              <span className="text-emerald-400">All accounts current</span>
            )}
          </div>
        </div>
      </div>

      {/* Plan Breakdown & MRR Trend Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscriptions by Plan */}
        <div className="p-6 rounded-2xl bg-[#0d131f] border border-[#1e293b] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight mb-1">Subscriptions by Tier</h2>
            <p className="text-xs text-zinc-400 mb-6">Distribution across active platform tiers</p>

            <div className="space-y-4">
              {/* Free */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-zinc-300">Free Tier ($0/mo)</span>
                  <span className="font-mono text-zinc-400">{metrics.planCounts.free} companies</span>
                </div>
                <div className="w-full bg-[#121927] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-zinc-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        metrics.totalCompanies > 0
                          ? (metrics.planCounts.free / metrics.totalCompanies) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Pro */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-indigo-300">Pro Tier ($79/mo)</span>
                  <span className="font-mono text-indigo-400 font-semibold">{metrics.planCounts.pro} companies</span>
                </div>
                <div className="w-full bg-[#121927] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        metrics.totalCompanies > 0
                          ? (metrics.planCounts.pro / metrics.totalCompanies) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Business */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-cyan-300">Business Tier ($249/mo)</span>
                  <span className="font-mono text-cyan-400 font-semibold">{metrics.planCounts.business} companies</span>
                </div>
                <div className="w-full bg-[#121927] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        metrics.totalCompanies > 0
                          ? (metrics.planCounts.business / metrics.totalCompanies) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-[#1e293b] flex items-center justify-between">
            <span className="text-xs text-zinc-400">Total Subscription Revenue</span>
            <span className="text-sm font-bold text-white font-mono">${metrics.mrr.toLocaleString()} / mo</span>
          </div>
        </div>

        {/* MRR Recent Trend */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0d131f] border border-[#1e293b]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">MRR Trend (Last 6 Months)</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Recurring subscription growth performance</p>
            </div>
            <Link
              href="/platform-admin/billing"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Detailed Billing →
            </Link>
          </div>

          <div className="grid grid-cols-6 gap-3 items-end h-44 pt-4 px-2">
            {mrrHistory.map((item, idx) => {
              const maxVal = Math.max(...mrrHistory.map((m) => m.mrr), 100);
              const heightPct = Math.round((item.mrr / maxVal) * 100);

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  <div className="text-[10px] font-mono text-zinc-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${item.mrr}
                  </div>
                  <div className="w-full max-w-[40px] bg-[#121927] rounded-t-lg overflow-hidden h-full flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t-lg transition-all duration-500 group-hover:from-indigo-600 group-hover:to-cyan-400"
                      style={{ height: `${Math.max(12, heightPct)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500 mt-2">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dual Tables: Recent Companies & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Companies */}
        <div className="p-6 rounded-2xl bg-[#0d131f] border border-[#1e293b]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white tracking-tight">Recent Company Signups</h2>
            <Link
              href="/platform-admin/companies"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1e293b] text-zinc-400 font-mono">
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60">
                {recentCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-[#121927]/40 transition-colors">
                    <td className="py-3 pr-2">
                      <div className="font-medium text-white truncate max-w-[150px]">{c.name}</div>
                      <div className="text-[11px] text-zinc-500 truncate max-w-[150px]">{c.email}</div>
                    </td>
                    <td className="py-3 pr-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {c.plan}
                      </span>
                    </td>
                    <td className="py-3 pr-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          c.status === "suspended"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : c.status === "payment_issue"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        {c.status || "active"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/platform-admin/companies/${c.id}`}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="p-6 rounded-2xl bg-[#0d131f] border border-[#1e293b]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white tracking-tight">Recent Platform Actions</h2>
            <Link
              href="/platform-admin/audit-log"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              View Full Audit →
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentAuditLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                No administrative actions recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e293b] text-zinc-400 font-mono">
                    <th className="pb-3 font-medium">Action</th>
                    <th className="pb-3 font-medium">Notes</th>
                    <th className="pb-3 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/60">
                  {recentAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#121927]/40 transition-colors">
                      <td className="py-3 pr-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                          {log.action.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-zinc-300 truncate max-w-[200px]">
                        {log.reason || "No notes"}
                      </td>
                      <td className="py-3 text-right font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
