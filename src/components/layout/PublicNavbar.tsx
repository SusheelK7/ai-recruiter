"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "../ui/ThemeToggle";

type SectionKey = "features" | "how-it-works" | "pricing";

interface PublicNavbarProps {
  activeSection?: SectionKey | null;
}

const navItems: Array<{ label: string; href: string; key: SectionKey }> = [
  { label: "Features", href: "/#features", key: "features" },
  { label: "How It Works", href: "/#how-it-works", key: "how-it-works" },
  { label: "Pricing", href: "/#pricing", key: "pricing" },
];

function navLinkClasses(isActive: boolean) {
  return [
    "relative rounded-full px-3 py-2 text-sm font-medium transition-all duration-200",
    isActive
      ? "bg-[#2E5B8A]/10 text-[#2E5B8A] dark:bg-[#4A7FC1]/15 dark:text-[#9DC4F0]"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-white",
  ].join(" ");
}

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

export function PublicNavbar({ activeSection }: PublicNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <>
      <header
        className={`fixed left-1/2 top-4 z-50 w-[calc(100vw-1rem)] max-w-[1180px] -translate-x-1/2 transition-all duration-300 sm:w-[calc(100vw-2rem)] ${
          isScrolled ? "shadow-[0_18px_40px_rgba(15,23,42,0.18)]" : "shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
        }`}
      >
        <div className="rounded-[28px] border border-white/55 bg-white/75 px-4 py-3 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-[#0F1420]/70 sm:px-5 lg:px-6">
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

            <nav className="hidden flex-1 items-center justify-center gap-1 sm:flex">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={navLinkClasses(activeSection === item.key)}
                >
                  {item.label}
                </Link>
              ))}
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

      <div
        className={`fixed inset-x-3 top-20 z-40 sm:hidden transition-all duration-300 ${
          isMobileMenuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
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

          <nav className="mt-5 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={navLinkClasses(activeSection === item.key) + " px-4 py-3 text-base"}
              >
                {item.label}
              </Link>
            ))}
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