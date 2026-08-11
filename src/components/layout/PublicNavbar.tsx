"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "../ui/ThemeToggle";

type SectionKey = "features" | "how-it-works" | "pricing";

interface PublicNavbarProps {
  activeSection?: SectionKey | null;
  onNavClick?: (key: SectionKey) => void;
}

const navItems: Array<{ label: string; href: string; key: SectionKey }> = [
  { label: "How It Works", href: "/#how-it-works", key: "how-it-works" },
  { label: "Features", href: "/#features", key: "features" },
  { label: "Pricing", href: "/#pricing", key: "pricing" },
];

function actionLinkClasses(variant: "ghost" | "primary") {
  if (variant === "primary") {
    return [
      "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold",
      "bg-[#2E5B8A] text-white shadow-sm transition-all duration-200",
      "hover:bg-[#23486E] active:scale-[0.98]",
      "dark:bg-[#4A7FC1] dark:hover:bg-[#3B6EB0]",
    ].join(" ");
  }

  return [
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold",
    "text-zinc-700 transition-all duration-200",
    "hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]",
    "dark:text-zinc-200 dark:hover:bg-zinc-800/80 dark:hover:text-white",
  ].join(" ");
}

export function PublicNavbar({ activeSection, onNavClick }: PublicNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Refs for each nav link to measure indicator position
  const navRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  // Indicator position state: left offset and width within the nav container
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const body = document.body;
    if (isMobileMenuOpen) {
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = "";
    }
    return () => {
      body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Update sliding indicator whenever activeSection changes
  useEffect(() => {
    if (!activeSection) {
      setIndicator(null);
      return;
    }
    const linkEl = navRefs.current[activeSection];
    const containerEl = navContainerRef.current;
    if (!linkEl || !containerEl) {
      setIndicator(null);
      return;
    }
    const containerRect = containerEl.getBoundingClientRect();
    const linkRect = linkEl.getBoundingClientRect();
    setIndicator({
      left: linkRect.left - containerRect.left,
      width: linkRect.width,
    });
  }, [activeSection]);

  const handleLinkClick = (key: SectionKey) => {
    onNavClick?.(key);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed left-1/2 top-4 sm:top-5 lg:top-6 z-50 w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1180px] -translate-x-1/2 transition-all duration-300`}
      >
        <div
          className={`rounded-[28px] border px-4 py-3 backdrop-blur-xl transition-all duration-300 sm:px-5 lg:px-6 ${isScrolled
              ? "border-white/80 bg-white/85 shadow-[0_18px_48px_rgba(15,23,42,0.18),0_6px_20px_rgba(15,23,42,0.08)] dark:border-white/20 dark:bg-[#0F1420]/90 dark:shadow-[0_18px_48px_rgba(0,0,0,0.65),0_0_30px_rgba(74,127,193,0.22)]"
              : "border-white/60 bg-white/70 shadow-[0_12px_36px_rgba(15,23,42,0.12),0_4px_16px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#0F1420]/75 dark:shadow-[0_12px_36px_rgba(0,0,0,0.5),0_0_24px_rgba(74,127,193,0.12)]"
            }`}
        >
          <div className="flex items-center gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <Image
                src="/web-logo.png"
                alt="AI Recruiter"
                width={156}
                height={40}
                className="hidden h-8 w-auto object-contain sm:block"
                priority
              />
              <Image
                src="/mobile-icon.png"
                alt="AI Recruiter"
                width={40}
                height={40}
                className="h-9 w-9 object-contain sm:hidden"
                priority
              />
            </Link>

            {/* Desktop nav with animated sliding indicator */}
            <nav
              className="hidden flex-1 items-center justify-center sm:flex"
              aria-label="Main navigation"
            >
              {/* Sliding pill indicator — rendered under links */}
              <div ref={navContainerRef} className="relative flex items-center gap-1">
                {/* Animated background pill */}
                {indicator && (
                  <span
                    className="pointer-events-none absolute top-0 h-full rounded-full bg-[#2E5B8A]/10 dark:bg-[#4A7FC1]/15 transition-all duration-300 ease-out"
                    style={{ left: indicator.left, width: indicator.width }}
                    aria-hidden="true"
                  />
                )}
                {navItems.map((item) => {
                  const isActive = activeSection === item.key;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      ref={(el) => {
                        navRefs.current[item.key] = el;
                      }}
                      onClick={() => handleLinkClick(item.key)}
                      className={[
                        "relative rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "text-[#2E5B8A] dark:text-[#9DC4F0]"
                          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
                      ].join(" ")}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item.label}
                      {/* Active underline accent */}
                      <span
                        className={[
                          "absolute bottom-0.5 left-3 right-3 h-[2px] rounded-full bg-[#2E5B8A] dark:bg-[#7CA8D8] transition-all duration-300",
                          isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0",
                        ].join(" ")}
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="hidden items-center gap-2 sm:flex">
              <ThemeToggle />
              <Link href="/login" className={actionLinkClasses("ghost")}>
                Log In
              </Link>
              <Link href="/register" className={actionLinkClasses("primary")}>
                Sign Up
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-all duration-200 hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:hidden"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-down menu */}
      <div
        className={`fixed left-4 right-4 top-[74px] sm:top-[84px] z-40 sm:hidden transition-all duration-300 ${isMobileMenuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
          }`}
      >
        <div className="rounded-[28px] border border-white/50 bg-white/90 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0F1420]/90">
          <div className="flex items-center justify-between gap-3">
            <ThemeToggle />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Menu
            </span>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-all duration-200 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Close menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <nav className="mt-5 flex flex-col gap-1" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const isActive = activeSection === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => handleLinkClick(item.key)}
                  className={[
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#2E5B8A]/10 text-[#2E5B8A] dark:bg-[#4A7FC1]/15 dark:text-[#9DC4F0]"
                      : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-white",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2E5B8A] dark:bg-[#7CA8D8]" aria-hidden="true" />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className={actionLinkClasses("ghost") + " w-full py-3 text-base"}
            >
              Log In
            </Link>
            <Link
              href="/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className={actionLinkClasses("primary") + " w-full py-3 text-base"}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-[1px] sm:hidden"
        />
      ) : null}
    </>
  );
}
