"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { NavTooltip } from "@/components/dashboard/NavTooltip";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { SidebarNotifBadge } from "@/components/layout/SidebarNotifBadge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const BriefcaseIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
  </svg>
);

const GridIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TeamIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const BellIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const navSections: NavSection[] = [
  {
    title: "RECRUIT",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <GridIcon /> },
      { label: "Jobs", href: "/dashboard/jobs", icon: <BriefcaseIcon /> },
      { label: "Applications", href: "/dashboard/applications", icon: <UsersIcon /> },
    ],
  },
  {
    title: "COORDINATE",
    items: [
      { label: "Interviews", href: "/dashboard/interviews", icon: <CalendarIcon /> },
      { label: "Team", href: "/dashboard/team", icon: <TeamIcon /> },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { label: "Company Profile", href: "/dashboard/profile", icon: <BuildingIcon /> },
      { label: "Analytics", href: "/dashboard/analytics", icon: <ChartIcon /> },
      { label: "Billing", href: "/dashboard/billing", icon: <CreditCardIcon /> },
      { label: "Settings", href: "/dashboard/settings", icon: <SettingsIcon /> },
    ],
  },
];

export function CompanySidebar() {
  const pathname = usePathname();
  const { companyName, collapsed, toggleCollapsed, mobileOpen, closeMobileSidebar } = useDashboard();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[260px]";

  const notifActive = pathname.startsWith("/dashboard/notifications");

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={`
          ${sidebarWidth}
          fixed left-0 top-0 z-30 flex h-[100dvh] flex-col
          border-r border-[var(--border-color)] bg-[var(--bg-card)]
          transition-[width] duration-[225ms] ease-in-out
          lg:sticky lg:top-0 lg:h-screen lg:self-start lg:shrink-0 lg:z-30
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo & Collapse Button */}
        <div className={`flex h-16 shrink-0 items-center border-b border-[var(--border-color)] px-4 ${collapsed ? "justify-center" : "justify-between gap-3"}`}>
          <div className={`flex items-center ${collapsed ? "" : "gap-2.5"}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-accent)] text-sm font-bold text-white">
              AI
            </div>
            {!collapsed && (
              <span className="truncate text-sm font-semibold text-[var(--text-primary)]">AI Recruiter</span>
            )}
          </div>

          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)]"
          >
            <svg
              className={`h-4 w-4 transition-transform duration-[225ms] ${collapsed ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scroll-smooth">
          {navSections.map((section) => (
            <div key={section.title} className="mb-5 last:mb-0">
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold tracking-widest text-[var(--text-muted)]">
                  {section.title}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <NavTooltip label={item.label} show={collapsed}>
                        <Link
                          href={item.href}
                          onClick={closeMobileSidebar}
                          className={`group flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                            collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                          } ${
                            active
                              ? "bg-[var(--brand-accent)] text-white shadow-sm"
                              : "text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          {item.icon}
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                      </NavTooltip>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Notifications Nav Item */}
          <div className="mt-1">
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold tracking-widest text-[var(--text-muted)]">
                UPDATES
              </p>
            )}
            <NavTooltip label="Notifications" show={collapsed}>
              <Link
                href="/dashboard/notifications"
                onClick={closeMobileSidebar}
                className={`group flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                } ${
                  notifActive
                    ? "bg-[var(--brand-accent)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)]"
                }`}
              >
                {/* Bell icon with live badge */}
                <span className="relative shrink-0">
                  <BellIcon />
                  <SidebarNotifBadge active={notifActive} />
                </span>
                {!collapsed && <span className="truncate">Notifications</span>}
                {/* Inline count badge when expanded */}
                {!collapsed && !notifActive && (
                  <SidebarNotifBadge inline active={false} />
                )}
              </Link>
            </NavTooltip>
          </div>
        </nav>

        {/* Footer: Theme + Company */}
        <div className="shrink-0 border-t border-[var(--border-color)] p-3">
          <div className={`mb-3 flex ${collapsed ? "justify-center" : "justify-end px-1"}`}>
            <ThemeToggle />
          </div>
          <div
            className={`flex items-center rounded-xl bg-[var(--bg-main)] ${
              collapsed ? "flex-col gap-2 p-2" : "gap-2.5 p-2"
            }`}
          >
            <NavTooltip label={companyName} show={collapsed}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-accent)]/15 text-sm font-semibold text-[var(--brand-accent)]">
                {companyName.charAt(0).toUpperCase()}
              </div>
            </NavTooltip>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
                  {companyName}
                </span>
                <LogoutButton compact />
              </>
            )}
            {collapsed && <LogoutButton compact iconOnly />}
          </div>
        </div>
      </aside>
    </>
  );
}
