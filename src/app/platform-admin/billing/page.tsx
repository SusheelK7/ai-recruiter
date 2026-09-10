"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function PlatformAdminBillingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/platform-admin/billing");
      if (!res.ok) throw new Error("Failed to load billing metrics");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Error loading billing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-zinc-400">Loading billing & revenue data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error || "Failed to load billing overview."}
        </div>
      </div>
    );
  }

  const { totalMrr, tierBreakdown, upcomingRenewals, paymentIssues, recentPlanChanges } = data;
  const projectedArr = totalMrr * 12;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1e293b]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Revenue & Billing Overview</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Global MRR analytics, subscription renewal pipeline, and payment health monitoring.
          </p>
        </div>

        <button
          onClick={fetchBilling}
          className="px-3.5 py-1.5 rounded-lg bg-[#121927] hover:bg-[#1a2337] border border-[#1e293b] text-zinc-300 text-xs font-medium transition-all flex items-center space-x-2 self-start sm:self-auto cursor-pointer"
        >
          <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Financials</span>
        </button>
      </div>

      {/* Top Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Total MRR</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">${totalMrr.toLocaleString()}</div>
          <p className="text-[11px] text-zinc-500 mt-2">Active monthly recurring revenue</p>
        </div>

        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Projected ARR</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">${projectedArr.toLocaleString()}</div>
          <p className="text-[11px] text-zinc-500 mt-2">Annualized run rate</p>
        </div>

        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Upcoming Renewals (30d)</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">{upcomingRenewals.length}</div>
          <p className="text-[11px] text-zinc-500 mt-2">Subscriptions due for renewal</p>
        </div>

        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Payment Flags</div>
          <div className={`text-2xl font-bold mt-1 font-mono ${paymentIssues.length > 0 ? "text-amber-400" : "text-zinc-400"}`}>
            {paymentIssues.length}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">Accounts with failed billing</p>
        </div>
      </div>

      {/* Tier Breakdown Cards */}
      <div>
        <h2 className="text-sm font-semibold text-white tracking-tight mb-3">MRR Breakdown by Plan Tier</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free */}
          <div className="p-5 rounded-2xl bg-[#0d131f] border border-[#1e293b]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase font-mono">Free Tier</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">$0/mo</span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white font-mono">{tierBreakdown.free?.count || 0}</div>
              <p className="text-xs text-zinc-500 mt-1">Free community accounts</p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#1e293b] flex justify-between text-xs font-mono">
              <span className="text-zinc-500">Tier MRR:</span>
              <span className="text-zinc-300 font-bold">$0</span>
            </div>
          </div>

          {/* Pro */}
          <div className="p-5 rounded-2xl bg-[#0d131f] border border-indigo-500/30 shadow-lg shadow-indigo-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase font-mono">Pro Tier</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                $79/mo
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-indigo-300 font-mono">{tierBreakdown.pro?.count || 0}</div>
              <p className="text-xs text-zinc-400 mt-1">Growing technical teams</p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#1e293b] flex justify-between text-xs font-mono">
              <span className="text-zinc-500">Tier MRR:</span>
              <span className="text-indigo-400 font-bold">${tierBreakdown.pro?.mrr?.toLocaleString() || 0}</span>
            </div>
          </div>

          {/* Business */}
          <div className="p-5 rounded-2xl bg-[#0d131f] border border-cyan-500/30 shadow-lg shadow-cyan-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase font-mono">Business Tier</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                $249/mo
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-cyan-300 font-mono">{tierBreakdown.business?.count || 0}</div>
              <p className="text-xs text-zinc-400 mt-1">Enterprise scale organizations</p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#1e293b] flex justify-between text-xs font-mono">
              <span className="text-zinc-500">Tier MRR:</span>
              <span className="text-cyan-400 font-bold">${tierBreakdown.business?.mrr?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Tables: Failed Payments Watchlist & Upcoming Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Issues */}
        <div className="p-6 rounded-2xl bg-[#0d131f] border border-[#1e293b]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <h2 className="text-sm font-semibold text-white tracking-tight">Payment Issues Watchlist</h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono">{paymentIssues.length} accounts</span>
          </div>

          <div className="overflow-x-auto">
            {paymentIssues.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                No payment failures flagged. All accounts in good standing.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e293b] text-zinc-400 font-mono">
                    <th className="pb-3 font-medium">Company</th>
                    <th className="pb-3 font-medium">Plan</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/60">
                  {paymentIssues.map((p: any) => (
                    <tr key={p.companyId} className="hover:bg-[#121927]/40 transition-colors">
                      <td className="py-3 pr-2">
                        <div className="font-semibold text-white truncate max-w-[150px]">{p.companyName}</div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[150px]">{p.companyEmail}</div>
                      </td>
                      <td className="py-3 pr-2 font-mono uppercase text-amber-400">{p.plan}</td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/platform-admin/companies/${p.companyId}`}
                          className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium"
                        >
                          Resolve →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="p-6 rounded-2xl bg-[#0d131f] border border-[#1e293b]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white tracking-tight">Upcoming Renewals (Next 30 Days)</h2>
            <span className="text-xs text-zinc-500 font-mono">{upcomingRenewals.length} renewals</span>
          </div>

          <div className="overflow-x-auto">
            {upcomingRenewals.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                No renewals scheduled within the next 30 days.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e293b] text-zinc-400 font-mono">
                    <th className="pb-3 font-medium">Company</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium text-right">Renewal Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/60">
                  {upcomingRenewals.map((r: any) => (
                    <tr key={r.companyId} className="hover:bg-[#121927]/40 transition-colors">
                      <td className="py-3 pr-2">
                        <Link
                          href={`/platform-admin/companies/${r.companyId}`}
                          className="font-semibold text-white hover:text-indigo-300 transition-colors truncate max-w-[150px] block"
                        >
                          {r.companyName}
                        </Link>
                        <span className="text-[10px] font-mono uppercase text-zinc-500">{r.plan}</span>
                      </td>
                      <td className="py-3 pr-2 font-mono text-emerald-400 font-semibold">${r.amount}</td>
                      <td className="py-3 text-right font-mono text-zinc-400">
                        {new Date(r.renewsAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Recent Plan Changes / Churn Visibility */}
      <div className="p-6 rounded-2xl bg-[#0d131f] border border-[#1e293b]">
        <h2 className="text-sm font-semibold text-white tracking-tight mb-4">
          Recent Plan Modifications & Support Adjustments
        </h2>
        {recentPlanChanges.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500 font-mono">
            No manual plan adjustments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1e293b] text-zinc-400 font-mono">
                  <th className="pb-3 font-medium">Tenant ID</th>
                  <th className="pb-3 font-medium">Adjustment Notes & Justification</th>
                  <th className="pb-3 font-medium text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60">
                {recentPlanChanges.map((log: any) => (
                  <tr key={log.id} className="hover:bg-[#121927]/40 transition-colors">
                    <td className="py-3 pr-2 font-mono text-indigo-400">
                      <Link href={`/platform-admin/companies/${log.targetCompanyId}`} className="hover:underline">
                        {log.targetCompanyId.slice(0, 12)}...
                      </Link>
                    </td>
                    <td className="py-3 pr-2 text-zinc-300">{log.reason}</td>
                    <td className="py-3 text-right font-mono text-zinc-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
