"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PlatformAdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal states
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState("pro");
  const [planChangeReason, setPlanChangeReason] = useState("");

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/platform-admin/companies/${id}`);
      if (!res.ok) throw new Error("Failed to load company profile");
      const json = await res.json();
      setData(json);
      if (json.company?.plan) {
        setSelectedNewPlan(json.company.plan);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Error fetching details" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
  }, [id]);

  const handleToggleSuspend = async () => {
    try {
      setActionLoading(true);
      const isCurrentlySuspended = data?.company?.status === "suspended";
      const action = isCurrentlySuspended ? "reinstate" : "suspend";

      const res = await fetch(`/api/platform-admin/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: suspendReason || (isCurrentlySuspended ? "Reinstated by admin" : "Suspended by admin"),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Action failed");

      setMessage({ type: "success", text: result.message });
      setShowSuspendModal(false);
      setSuspendReason("");
      fetchCompanyDetails();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualPlanChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planChangeReason.trim()) {
      setMessage({ type: "error", text: "A reason is mandatory for manual plan changes." });
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/platform-admin/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_plan",
          plan: selectedNewPlan,
          reason: planChangeReason,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Plan update failed");

      setMessage({ type: "success", text: result.message });
      setShowPlanModal(false);
      setPlanChangeReason("");
      fetchCompanyDetails();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-zinc-400">Loading company records...</p>
        </div>
      </div>
    );
  }

  if (!data?.company) {
    return (
      <div className="p-8 space-y-4">
        <Link href="/platform-admin/companies" className="text-xs text-indigo-400 hover:underline">
          ← Return to Companies
        </Link>
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          Company not found or inaccessible.
        </div>
      </div>
    );
  }

  const { company, subscription, usage, teamMembers, invoices, auditLogs } = data;
  const isSuspended = company.status === "suspended";

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/platform-admin/companies"
          className="inline-flex items-center text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Companies
        </Link>
        <div className="font-mono text-xs text-zinc-500">Tenant ID: {company.id}</div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
              : "bg-rose-500/10 text-rose-300 border-rose-500/30"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Main Header / Status Card */}
      <div className="p-6 rounded-2xl bg-[#0d131f] border border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-900 to-[#121927] border border-indigo-500/30 flex items-center justify-center text-xl font-bold text-indigo-300 shadow-inner shrink-0">
            {company.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">{company.name}</h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                  isSuspended
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : company.status === "payment_issue"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                }`}
              >
                {company.status || "active"}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                {company.plan} Tier
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-mono">{company.email}</p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-zinc-500 font-mono">
              <span>Joined {new Date(company.createdAt).toLocaleDateString()}</span>
              {company.industry && <span>• {company.industry}</span>}
              {company.location && <span>• {company.location}</span>}
              {company.website && (
                <a href={company.website} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                  {company.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowPlanModal(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium transition-all cursor-pointer"
          >
            Adjust Plan Manually
          </button>
          <button
            onClick={() => setShowSuspendModal(true)}
            className={`px-4 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              isSuspended
                ? "bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 text-emerald-300"
                : "bg-rose-600/20 hover:bg-rose-600/30 border-rose-500/40 text-rose-300"
            }`}
          >
            {isSuspended ? "Reinstate Account" : "Suspend Account"}
          </button>
        </div>
      </div>

      {/* Usage Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Active Jobs Posted</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">
            {usage.jobsPosted} <span className="text-xs text-zinc-500 font-normal">/ {usage.jobLimit}</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">Active listings currently open</p>
        </div>

        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Applications Received</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">{usage.applicationsReceived}</div>
          <p className="text-[11px] text-zinc-500 mt-2">Total candidate submissions</p>
        </div>

        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">AI Resume Scans Used</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">
            {usage.aiScansUsed} <span className="text-xs text-zinc-500 font-normal">/ {usage.aiScansLimit}</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">Resume screening quota</p>
        </div>

        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1e293b]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Recruiter Seats Filled</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">
            {usage.seatsUsed} <span className="text-xs text-zinc-500 font-normal">/ {usage.seatsLimit}</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">Registered team members</p>
        </div>
      </div>

      {/* Dual Section: Team Members & Stripe Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <div className="p-6 rounded-2xl bg-[#0d131f] border border-[#1e293b]">
          <h2 className="text-sm font-semibold text-white tracking-tight mb-4">Team Members & Roles</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1e293b] text-zinc-400 font-mono">
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium text-right">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60">
                {teamMembers.map((member: any) => (
                  <tr key={member.id} className="hover:bg-[#121927]/40 transition-colors">
                    <td className="py-3 pr-2 font-mono text-zinc-300">{member.email}</td>
                    <td className="py-3 pr-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {member.emailVerified ? (
                        <span className="text-emerald-400 text-[11px]">✓ Yes</span>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stripe Invoices */}
        <div className="p-6 rounded-2xl bg-[#0d131f] border border-[#1e293b]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white tracking-tight">Billing & Stripe Invoices</h2>
            <span className="text-[11px] font-mono text-zinc-500">
              Customer: {subscription?.stripeCustomerId || "No Stripe ID"}
            </span>
          </div>

          <div className="overflow-x-auto">
            {invoices.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                No invoices recorded on this account.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e293b] text-zinc-400 font-mono">
                    <th className="pb-3 font-medium">Invoice ID</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/60">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-[#121927]/40 transition-colors">
                      <td className="py-3 pr-2 font-mono text-zinc-300 truncate max-w-[120px]">{inv.id}</td>
                      <td className="py-3 pr-2 font-mono text-white font-semibold">${inv.amount}</td>
                      <td className="py-3 pr-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            inv.status === "paid"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-zinc-500 whitespace-nowrap">
                        {new Date(inv.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Audit History For This Company */}
      <div className="p-6 rounded-2xl bg-[#0d131f] border border-[#1e293b]">
        <h2 className="text-sm font-semibold text-white tracking-tight mb-4">
          Administrative Actions History ({auditLogs.length})
        </h2>
        {auditLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500 font-mono">
            No administrative actions recorded for this company yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1e293b] text-zinc-400 font-mono">
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">Reason / Details</th>
                  <th className="pb-3 font-medium text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-[#121927]/40 transition-colors">
                    <td className="py-3 pr-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {log.action.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-zinc-300">{log.reason || "No notes"}</td>
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

      {/* Modal: Suspend / Reinstate Confirmation */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0e1320] border border-[#1e293b] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              {isSuspended ? "Reinstate Company Access" : "Suspend Company Account"}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              {isSuspended
                ? "This will restore login access and all dashboard features for this company."
                : "This will immediately block all company users from logging in or accessing the dashboard."}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                Audit Reason (Required for administrative records):
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Delinquent billing, terms of service review, or owner request..."
                rows={3}
                className="w-full p-2.5 rounded-lg bg-[#070a11] border border-[#1e293b] text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                className="px-4 py-2 rounded-lg bg-[#121927] hover:bg-[#1a2337] text-zinc-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleToggleSuspend}
                className={`px-4 py-2 rounded-lg text-xs font-medium text-white transition-all cursor-pointer ${
                  isSuspended ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {actionLoading ? "Processing..." : isSuspended ? "Confirm Reinstate" : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manual Plan Adjustment */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <form
            onSubmit={handleManualPlanChange}
            className="w-full max-w-md rounded-2xl bg-[#0e1320] border border-[#1e293b] p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-white">Manual Plan Adjustment</h3>
            <p className="text-xs text-zinc-400">
              Manually updates the company subscription tier directly, bypassing Stripe for customer support or contract exemptions.
            </p>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5">Target Tier</label>
              <select
                value={selectedNewPlan}
                onChange={(e) => setSelectedNewPlan(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#070a11] border border-[#1e293b] text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="free">Free ($0/mo) - 1 Job, 50 AI Scans, 1 Seat</option>
                <option value="pro">Pro ($79/mo) - 10 Jobs, 500 AI Scans, 3 Seats</option>
                <option value="business">Business ($249/mo) - Unlimited Jobs, 5,000 Scans</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                Mandatory Reason (Logged in Audit Trail) *
              </label>
              <textarea
                required
                value={planChangeReason}
                onChange={(e) => setPlanChangeReason(e.target.value)}
                placeholder="e.g. VIP contract agreement, complimentary trial extension, or tier migration support..."
                rows={3}
                className="w-full p-2.5 rounded-lg bg-[#070a11] border border-[#1e293b] text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 rounded-lg bg-[#121927] hover:bg-[#1a2337] text-zinc-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all cursor-pointer"
              >
                {actionLoading ? "Updating Plan..." : "Apply Plan Change"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
