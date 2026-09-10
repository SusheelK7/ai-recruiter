"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

type FilterTab = "all" | "unread" | "application" | "interview" | "test_completed" | "stage_change" | "billing";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "application", label: "Applications" },
  { key: "interview", label: "Interviews" },
  { key: "test_completed", label: "Assessments" },
  { key: "stage_change", label: "Stage Changes" },
  { key: "billing", label: "Billing" },
];

const TYPE_COLORS: Record<string, string> = {
  application: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  ai_screening: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  test_completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  interview: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  stage_change: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  billing: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  system: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const TYPE_ICON_BG: Record<string, string> = {
  application: "bg-violet-50 dark:bg-violet-950/40",
  ai_screening: "bg-indigo-50 dark:bg-indigo-950/40",
  test_completed: "bg-emerald-50 dark:bg-emerald-950/40",
  interview: "bg-amber-50 dark:bg-amber-950/40",
  stage_change: "bg-blue-50 dark:bg-blue-950/40",
  billing: "bg-rose-50 dark:bg-rose-950/40",
  system: "bg-zinc-100 dark:bg-zinc-800",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  application: (
    <svg className="h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  ai_screening: (
    <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  test_completed: (
    <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  interview: (
    <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  stage_change: (
    <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  billing: (
    <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  system: (
    <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function getTypeIcon(type: string) {
  return TYPE_ICONS[type] ?? TYPE_ICONS.system;
}
function getTypeBg(type: string) {
  return TYPE_ICON_BG[type] ?? TYPE_ICON_BG.system;
}
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    application: "Application",
    ai_screening: "AI Screening",
    test_completed: "Assessment",
    interview: "Interview",
    stage_change: "Stage",
    billing: "Billing",
    system: "System",
  };
  return labels[type] ?? type;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchNotifications = useCallback(async (tab: FilterTab) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "60" });
      if (tab === "unread") {
        params.set("unreadOnly", "true");
      } else if (tab !== "all") {
        params.set("type", tab);
      }
      const res = await fetch(`/api/notifications?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setTotalCount(data.totalCount || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(activeTab);
  }, [activeTab, fetchNotifications]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all notifications? This cannot be undone.")) return;
    setClearing(true);
    try {
      await fetch("/api/notifications?clearAll=true", { method: "DELETE" });
      setNotifications([]);
      setUnreadCount(0);
      setTotalCount(0);
    } finally {
      setClearing(false);
    }
  };

  const handleMarkRead = async (id: string, read: boolean) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read } : n))
    );
    setUnreadCount((prev) => (read ? Math.max(0, prev - 1) : prev + 1));
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    }).catch(() => {});
  };

  const handleDelete = async (id: string) => {
    const n = notifications.find((x) => x.id === id);
    setNotifications((prev) => prev.filter((x) => x.id !== id));
    if (n && !n.read) setUnreadCount((prev) => Math.max(0, prev - 1));
    fetch(`/api/notifications?id=${id}`, { method: "DELETE" }).catch(() => {});
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.read) {
      handleMarkRead(n.id, true);
    }
    if (n.link) router.push(n.link);
  };

  const filtered = notifications.filter((n) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
  });

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 border-b border-[var(--border-color)] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Notification Center
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Real-time updates on candidates, interviews, assessments, and billing.
            {totalCount > 0 && (
              <span className="ml-2 text-[var(--text-primary)] font-semibold">
                {totalCount} total
                {unreadCount > 0 && (
                  <span className="ml-1 text-violet-600 dark:text-violet-400">
                    · {unreadCount} unread
                  </span>
                )}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-violet-500 hover:text-violet-600 transition disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {markingAll ? "Marking..." : "Mark all read"}
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-3 py-2 text-xs font-semibold text-rose-600 hover:border-rose-400 transition disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {clearing ? "Clearing..." : "Clear all"}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.key
                  ? "bg-[var(--brand-accent)] text-white shadow-sm"
                  : "border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--brand-accent)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
              {tab.key === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:ml-auto">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] py-2 pl-9 pr-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-violet-500 sm:w-64"
          />
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
            <p className="text-sm text-[var(--text-muted)]">Loading notifications...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-[var(--border-color)] py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 dark:bg-violet-950/30 text-violet-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {search ? "No results found" : "All caught up!"}
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {search
                ? `No notifications match "${search}".`
                : activeTab === "unread"
                ? "You have no unread notifications."
                : "No notifications in this category yet."}
            </p>
          </div>
          {(search || activeTab !== "all") && (
            <button
              type="button"
              onClick={() => { setSearch(""); setActiveTab("all"); }}
              className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`group relative flex items-start gap-4 rounded-2xl border p-4 transition-all duration-200 ${
                !n.read
                  ? "border-violet-200 bg-violet-50/50 dark:border-violet-800/50 dark:bg-violet-950/10"
                  : "border-[var(--border-color)] bg-[var(--bg-main)] hover:border-violet-300 dark:hover:border-violet-800"
              }`}
            >
              {/* Unread Dot */}
              {!n.read && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-violet-500" />
              )}

              {/* Icon */}
              <div
                className={`ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${getTypeBg(n.type)}`}
              >
                {getTypeIcon(n.type)}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start gap-2">
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className="text-left"
                  >
                    <p className={`text-sm leading-snug ${!n.read ? "font-bold text-[var(--text-primary)]" : "font-semibold text-[var(--text-primary)]"}`}>
                      {n.title}
                    </p>
                  </button>
                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TYPE_COLORS[n.type] || TYPE_COLORS.system}`}>
                    {getTypeLabel(n.type)}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{n.message}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-[11px] text-[var(--text-muted)]">{timeAgo(n.createdAt)}</span>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => !n.read && handleMarkRead(n.id, true)}
                      className="text-[11px] font-semibold text-violet-600 hover:underline dark:text-violet-400"
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleMarkRead(n.id, !n.read)}
                  title={n.read ? "Mark as unread" : "Mark as read"}
                  className="rounded-lg border border-[var(--border-color)] p-1.5 text-[var(--text-muted)] hover:border-violet-400 hover:text-violet-600 transition"
                >
                  {n.read ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  title="Delete"
                  className="rounded-lg border border-[var(--border-color)] p-1.5 text-[var(--text-muted)] hover:border-rose-400 hover:text-rose-600 transition"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
