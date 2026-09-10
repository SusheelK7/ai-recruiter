"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface CompanyItem {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  industry: string | null;
  createdAt: string;
  _count: {
    jobs: number;
    users: number;
  };
}

export default function PlatformAdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: String(page),
        limit: "10",
        search,
        plan: selectedPlan,
        status: selectedStatus,
      });

      const res = await fetch(`/api/platform-admin/companies?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch companies");
      const data = await res.json();

      setCompanies(data.companies || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, selectedPlan, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCompanies();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1e293b]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Registered Companies</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Browse, search, and manage all {totalCount} company tenant accounts.
          </p>
        </div>

        <button
          onClick={fetchCompanies}
          className="px-3.5 py-1.5 rounded-lg bg-[#121927] hover:bg-[#1a2337] border border-[#1e293b] text-zinc-300 text-xs font-medium transition-all flex items-center space-x-2 self-start sm:self-auto cursor-pointer"
        >
          <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-xl bg-[#0d131f] border border-[#1e293b] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies by name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#070a11] border border-[#1e293b] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-3">
          {/* Plan Filter */}
          <select
            value={selectedPlan}
            onChange={(e) => {
              setSelectedPlan(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#070a11] border border-[#1e293b] text-zinc-300 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Plans</option>
            <option value="free">Free Tier</option>
            <option value="pro">Pro Tier</option>
            <option value="business">Business Tier</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#070a11] border border-[#1e293b] text-zinc-300 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="payment_issue">Payment Issue</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div className="rounded-2xl bg-[#0d131f] border border-[#1e293b] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1e293b] bg-[#090d16] text-zinc-400 font-mono">
                <th className="py-3.5 px-4 font-medium">Company Name</th>
                <th className="py-3.5 px-4 font-medium">Plan</th>
                <th className="py-3.5 px-4 font-medium">Status</th>
                <th className="py-3.5 px-4 font-medium">Jobs Posted</th>
                <th className="py-3.5 px-4 font-medium">Recruiters</th>
                <th className="py-3.5 px-4 font-medium">Signed Up</th>
                <th className="py-3.5 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono">
                    Loading companies...
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono">
                    No companies found matching the criteria.
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-[#121927]/60 transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <Link href={`/platform-admin/companies/${company.id}`} className="block">
                        <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {company.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">{company.email}</div>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          company.plan === "business"
                            ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                            : company.plan === "pro"
                            ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                            : "bg-zinc-800 text-zinc-300 border-zinc-700"
                        }`}
                      >
                        {company.plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                          company.status === "suspended"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : company.status === "payment_issue"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                            company.status === "suspended"
                              ? "bg-rose-500"
                              : company.status === "payment_issue"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        {company.status || "active"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      {company._count?.jobs ?? 0}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      {company._count?.users ?? 0}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-500 whitespace-nowrap">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/platform-admin/companies/${company.id}`}
                        className="inline-flex items-center px-2.5 py-1 rounded bg-[#121927] hover:bg-indigo-600/20 border border-[#1e293b] hover:border-indigo-500/40 text-indigo-300 text-xs transition-all"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#1e293b] flex items-center justify-between text-xs text-zinc-400">
            <div>
              Showing page <span className="font-mono text-white">{page}</span> of{" "}
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
