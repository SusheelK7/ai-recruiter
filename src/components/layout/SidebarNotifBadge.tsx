"use client";

import React, { useEffect, useState, useCallback } from "react";

interface Props {
  active?: boolean;
  inline?: boolean; // when true renders a pill next to label, otherwise an absolute dot
}

export function SidebarNotifBadge({ active, inline }: Props) {
  const [count, setCount] = useState(0);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=1");
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.unreadCount ?? 0);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, 30_000);
    return () => clearInterval(t);
  }, [fetch_]);

  if (count === 0) return null;

  // Inline pill — shown next to "Notifications" label when expanded
  if (inline) {
    return (
      <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
        {count > 99 ? "99+" : count}
      </span>
    );
  }

  // Absolute dot — shown on the bell icon (collapsed & expanded)
  return (
    <span
      className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white ${
        active ? "bg-white/80 text-[var(--brand-accent)]" : "bg-rose-500"
      }`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
