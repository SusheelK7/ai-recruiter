"use client";

import React, { useState } from "react";

interface NavTooltipProps {
  label: string;
  show: boolean;
  children: React.ReactNode;
}

export function NavTooltip({ label, show, children }: NavTooltipProps) {
  const [visible, setVisible] = useState(false);

  if (!show) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative flex justify-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900 pointer-events-none">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-900 dark:border-r-zinc-100" />
        </div>
      )}
    </div>
  );
}
