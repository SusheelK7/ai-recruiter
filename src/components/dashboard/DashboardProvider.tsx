"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const SIDEBAR_STORAGE_KEY = "ai-recruiter-sidebar-collapsed";

interface DashboardContextValue {
  companyName: string;
  setCompanyName: (name: string) => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  closeMobileSidebar: () => void;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [companyName, setCompanyName] = useState("Your Company");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved === "true") {
      setCollapsed(true);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  const closeMobileSidebar = () => setMobileOpen(false);

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-[var(--bg-main)]">
        <div className="hidden w-[260px] shrink-0 bg-[var(--bg-card)] lg:block" />
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <DashboardContext.Provider
      value={{
        companyName,
        setCompanyName,
        collapsed,
        toggleCollapsed,
        mobileOpen,
        setMobileOpen,
        closeMobileSidebar,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}
