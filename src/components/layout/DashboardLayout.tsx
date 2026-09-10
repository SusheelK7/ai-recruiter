"use client";

import React from "react";
import { CompanySidebar } from "@/components/layout/CompanySidebar";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";
import { DashboardTopBar } from "@/components/layout/DashboardTopBar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <div className="flex min-h-screen w-full bg-[var(--bg-main)]">
        <CompanySidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
          <DashboardTopBar />
          <main className="flex-1 overflow-y-auto scroll-smooth">
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
