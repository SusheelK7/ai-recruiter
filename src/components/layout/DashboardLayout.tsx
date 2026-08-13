"use client";

import React from "react";
import { CompanySidebar } from "@/components/layout/CompanySidebar";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <div className="flex min-h-screen w-full bg-[var(--bg-main)]">
        <CompanySidebar />
        <main className="min-h-screen min-w-0 flex-1 overflow-x-hidden overflow-y-auto scroll-smooth transition-[width] duration-[225ms] ease-in-out">
          {children}
        </main>
      </div>
    </DashboardProvider>
  );
}
