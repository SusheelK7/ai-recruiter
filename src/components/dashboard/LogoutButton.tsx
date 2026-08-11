"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Logout failed.");
      }

      router.push("/login");
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {isLoggingOut ? "Logging out..." : "Log Out"}
    </button>
  );
}