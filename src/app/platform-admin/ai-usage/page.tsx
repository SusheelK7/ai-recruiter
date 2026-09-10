"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function PlatformAdminAiUsagePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAiMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/platform-admin/ai-usage");
      if (!res.ok) throw new Error("Failed to load AI usage metrics");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Error loading AI metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiMetrics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-zinc-400">Loading AI telemetry & Gemini token rates...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error || "Failed to load AI usage overview."}
        </div>
      </div>
    );
  }

  const { metrics, unitCosts, companyBreakdown } = data;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Usage & Cost Monitoring</h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Google Gemini Flash 3.6
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Aggregate LLM consumption, estimated compute expense, and per-tenant cost breakdown.
          </p>
        </div>

        <button
          onClick={fetchAiMetrics}
          className="px-3.5 py-1.5 rounded-lg bg-[#121927] hover:bg-[#1a2337] border border-[#1e293b] text-zinc-300 text-xs font-medium transition-all flex items-center space-x-2 self-start sm:self-auto cursor-pointer"
        >
          <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Usage</span>
        </button>
      </div>

      {/* Top Cost & Operations Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost */}
        <div className="p-5 rounded-xl bg-[#0d131f] border border-cyan-500/30 shadow-lg shadow-cyan-950/20">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Total AI Cost (This Month)</div>
          <div className="text-3xl font-bold text-cyan-400 mt-1 font-mono">${metrics.totalCostThisMonth.toFixed(2)}</div>
          <p className="text-[11px] text-zinc-500 mt-2">Combined compute across all tenants</p>
        </div>

        {/* Total Operations */}
        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Total AI Operations</div>
          <div className="text-3xl font-bold text-white mt-1 font-mono">{metrics.totalEvents.toLocaleString()}</div>
          <p className="text-[11px] text-zinc-500 mt-2">Total calls dispatched to Gemini</p>
        </div>

        {/* Resume Scans */}
        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Resume Screenings</div>
          <div className="text-3xl font-bold text-indigo-400 mt-1 font-mono">{metrics.totalResumeScans.toLocaleString()}</div>
          <p className="text-[11px] text-zinc-500 mt-2 font-mono">${unitCosts.resume_scan} / candidate scan</p>
        </div>

        {/* Video Transcriptions */}
        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Video Transcriptions</div>
          <div className="text-3xl font-bold text-purple-400 mt-1 font-mono">{metrics.totalVideoTranscriptions.toLocaleString()}</div>
          <p className="text-[11px] text-zinc-500 mt-2 font-mono">${unitCosts.video_transcription} / video transcript</p>
        </div>
      </div>

      {/* Pricing Matrix Reference Banner */}
      <div className="p-4 rounded-xl bg-[#090d16] border border-[#1e293b] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2 text-zinc-300">
          <span className="font-semibold text-white">Gemini Unit Cost Model:</span>
          <span>Standardized per-operation amortized rates</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 font-mono text-[11px] text-zinc-400">
          <span>Resume Scans: <strong className="text-white">${unitCosts.resume_scan}</strong></span>
          <span>Test MCQ Gen: <strong className="text-white">${unitCosts.test_eval}</strong></span>
          <span>Video Transcripts: <strong className="text-white">${unitCosts.video_transcription}</strong></span>
          <span>Chatbot Messages: <strong className="text-white">${unitCosts.chatbot_message}</strong></span>
        </div>
      </div>

      {/* Per-Company Cost Breakdown Table */}
      <div className="rounded-2xl bg-[#0d131f] border border-[#1e293b] overflow-hidden">
        <div className="p-5 border-b border-[#1e293b] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Per-Company Consumption Ranking</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ranked by total estimated cost. Disproportionate usage highlighted to detect abuse.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400">{companyBreakdown.length} companies</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1e293b] bg-[#090d16] text-zinc-400 font-mono">
                <th className="py-3 px-4 font-medium">Company</th>
                <th className="py-3 px-4 font-medium">Plan</th>
                <th className="py-3 px-4 font-medium text-right">Resume Scans</th>
                <th className="py-3 px-4 font-medium text-right">MCQ Tests</th>
                <th className="py-3 px-4 font-medium text-right">Videos</th>
                <th className="py-3 px-4 font-medium text-right">Chatbot</th>
                <th className="py-3 px-4 font-medium text-right">Total Ops</th>
                <th className="py-3 px-4 font-medium text-right">Est. Cost</th>
                <th className="py-3 px-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/60">
              {companyBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500 font-mono">
                    No company usage recorded this month.
                  </td>
                </tr>
              ) : (
                companyBreakdown.map((item: any) => (
                  <tr
                    key={item.companyId}
                    className={`hover:bg-[#121927]/60 transition-colors ${
                      item.isDisproportionate ? "bg-amber-500/5" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-medium">
                      <Link
                        href={`/platform-admin/companies/${item.companyId}`}
                        className="text-white hover:text-indigo-300 transition-colors"
                      >
                        {item.companyName}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-800 text-zinc-300">
                        {item.plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-300">{item.resumeScans}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-300">{item.testEvals}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-300">{item.videoTranscriptions}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-300">{item.chatbotMessages}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-white">{item.totalEvents}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-400">
                      ${item.estimatedCost.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.isDisproportionate ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          ⚠ Disproportionate
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-[11px] font-mono">Normal</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
