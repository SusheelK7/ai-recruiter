"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface AuditLogEntry {
  id: string;
  platformAdminId: string;
  action: string;
  targetCompanyId: string;
  reason: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    email: string;
  };
}

export default function PlatformAdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: String(page),
        limit: "15",
        action: selectedAction,
      });

      const res = await fetch(`/api/platform-admin/audit-log?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      const data = await res.json();

      setLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, selectedAction]);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1e293b]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Audit Log</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Immutable trace of administrative actions, account suspensions, and manual plan modifications.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="px-3.5 py-1.5 rounded-lg bg-[#121927] hover:bg-[#1a2337] border border-[#1e293b] text-zinc-300 text-xs font-medium transition-all flex items-center space-x-2 self-start sm:self-auto cursor-pointer"
        >
          <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[#0d131f] border border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-zinc-400 font-mono">Filter by Action:</span>
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-[#070a11] border border-[#1e293b] text-zinc-300 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Actions ({totalCount})</option>
            <option value="suspend_company">Suspensions</option>
            <option value="reinstate_company">Reinstatements</option>
            <option value="manual_plan_change">Plan Modifications</option>
          </select>
        </div>
        <div className="text-xs font-mono text-zinc-500">Total Entries: {totalCount}</div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-[#0d131f] border border-[#1e293b] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1e293b] bg-[#090d16] text-zinc-400 font-mono">
                <th className="py-3.5 px-4 font-medium">Timestamp</th>
                <th className="py-3.5 px-4 font-medium">Action</th>
                <th className="py-3.5 px-4 font-medium">Target Company</th>
                <th className="py-3.5 px-4 font-medium">Justification / Reason</th>
                <th className="py-3.5 px-4 font-medium text-right">Admin ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500 font-mono">
                    Loading audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500 font-mono">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#121927]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-zinc-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase border font-semibold ${
                          log.action === "suspend_company"
                            ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                            : log.action === "reinstate_company"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                        }`}
                      >
                        {log.action.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/platform-admin/companies/${log.targetCompanyId}`}
                        className="font-medium text-white hover:text-indigo-300 transition-colors"
                      >
                        {log.company?.name || "Target Company"}
                      </Link>
                      <div className="text-[10px] font-mono text-zinc-500">{log.company?.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 max-w-md">
                      {log.reason || <span className="text-zinc-600 italic">No notes logged</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-500 text-[11px]">
                      {log.platformAdminId ? `${log.platformAdminId.slice(0, 10)}...` : "System"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#1e293b] flex items-center justify-between text-xs text-zinc-400">
            <div>
              Page <span className="font-mono text-white">{page}</span> of{" "}
              <span className="font-mono text-white">{totalPages}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded bg-[#070a11] border border-[#1e293b] hover:bg-[#121927] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded bg-[#070a11] border border-[#1e293b] hover:bg-[#121927] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
