"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export function AuthIllustration() {
  const [cardIndex, setCardIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCardIndex((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-between sm:p-11 overflow-hidden bg-gradient-to-br from-[#2E5B8A] via-[#244A72] to-[#1B3654] dark:from-[#1B324D] dark:via-[#16273C] dark:to-[#0F1A28] text-white">
      {/* Background Decorative Blur Circles */}
      <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/10 dark:bg-sky-400/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="relative z-10 flex items-center gap-3 ">
        <Link href="/">
          <Image
            src="/web-logo.png"
            alt="AI Recruiter"
            width={200}
            height={56}
            className="h-16 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      {/* Centered Modern Minimal Recruitment SVG Illustration */}
      <div className="relative z-10 my-auto py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm aspect-square relative flex items-center justify-center">
          <svg
            className="w-full h-full max-h-[320px] drop-shadow-xl transition-all duration-300"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Grid & Accent Ring */}
            <circle cx="200" cy="200" r="150" stroke="white" strokeOpacity="0.08" strokeWidth="2" strokeDasharray="6 6" />
            <circle cx="200" cy="200" r="110" stroke="white" strokeOpacity="0.12" strokeWidth="1" />

            {/* Mockup Card Cluster with Gentle Up-Down Drift Animation */}
            <g className="animate-float-drift">
              {/* Resume / Candidate Card 1 (Left background) */}
              <rect x="70" y="110" width="130" height="170" rx="12" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
              <rect x="90" y="135" width="45" height="10" rx="5" fill="white" fillOpacity="0.4" />
              <rect x="90" y="155" width="90" height="6" rx="3" fill="white" fillOpacity="0.2" />
              <rect x="90" y="170" width="75" height="6" rx="3" fill="white" fillOpacity="0.2" />
              <rect x="90" y="185" width="85" height="6" rx="3" fill="white" fillOpacity="0.2" />
              <circle cx="160" cy="240" r="14" fill="#38BDF8" fillOpacity="0.3" />
              <path d="M154 240L158 244L166 236" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

              {/* AI Evaluation Featured Card (Center) */}
              <g transform="translate(140, 130)">
                <rect x="0" y="0" width="190" height="200" rx="16" fill="white" fillOpacity="0.95" className="dark:fill-slate-900/90" stroke="white" strokeOpacity="0.3" strokeWidth="2" />

                {/* Header Profile Avatar & Name */}
                <circle cx="35" cy="38" r="16" fill="#38BDF8" />
                <path d="M35 29A6 6 0 0 0 29 35H41A6 6 0 0 0 35 29Z" fill="white" />
                <rect x="62" y="28" width="80" height="8" rx="4" fill="#1E293B" className="dark:fill-slate-100" />
                <rect x="62" y="42" width="55" height="6" rx="3" fill="#64748B" />

                {/* Divider */}
                <line x1="20" y1="65" x2="170" y2="65" stroke="#E2E8F0" strokeOpacity="0.6" strokeWidth="1" />

                {/* DYNAMIC ROTATING CARD STATE CONTENT */}
                {cardIndex === 0 && (
                  <g className="transition-opacity duration-300">
                    {/* Match Score Badge */}
                    <rect x="135" y="24" width="42" height="22" rx="11" fill="#10B981" fillOpacity="0.15" />
                    <text x="156" y="39" textAnchor="middle" fill="#059669" className="dark:fill-emerald-400" fontSize="10" fontWeight="bold">98%</text>

                    {/* AI Skill Checklist items */}
                    <g transform="translate(20, 80)">
                      <rect x="0" y="0" width="16" height="16" rx="4" fill="#10B981" />
                      <path d="M4 8L7 11L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <rect x="26" y="4" width="90" height="8" rx="4" fill="#334155" className="dark:fill-slate-200" />
                    </g>

                    <g transform="translate(20, 110)">
                      <rect x="0" y="0" width="16" height="16" rx="4" fill="#10B981" />
                      <path d="M4 8L7 11L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <rect x="26" y="4" width="110" height="8" rx="4" fill="#334155" className="dark:fill-slate-200" />
                    </g>

                    <g transform="translate(20, 140)">
                      <rect x="0" y="0" width="16" height="16" rx="4" fill="#38BDF8" />
                      <path d="M4 8L7 11L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <rect x="26" y="4" width="75" height="8" rx="4" fill="#334155" className="dark:fill-slate-200" />
                    </g>

                    {/* Status footer Pill */}
                    <rect x="20" y="168" width="150" height="18" rx="9" fill="#0EA5E9" fillOpacity="0.1" />
                    <text x="95" y="181" textAnchor="middle" fill="#0284C7" className="dark:fill-sky-400" fontSize="9" fontWeight="600">AI Match: Senior Engineer</text>
                  </g>
                )}

                {cardIndex === 1 && (
                  <g className="transition-opacity duration-300">
                    {/* LIVE Status Badge */}
                    <rect x="135" y="24" width="42" height="22" rx="11" fill="#0284C7" fillOpacity="0.15" />
                    <text x="156" y="39" textAnchor="middle" fill="#0284C7" className="dark:fill-sky-400" fontSize="9" fontWeight="bold">LIVE</text>

                    {/* Security Badge */}
                    <g transform="translate(20, 78)">
                      <rect x="0" y="0" width="150" height="24" rx="6" fill="#F0F9FF" className="dark:fill-slate-800" stroke="#BAE6FD" strokeWidth="1" />
                      <path d="M12 7L18 10V14C18 17 15 19 12 20C9 19 6 17 6 14V10L12 7Z" fill="#0284C7" transform="scale(0.7) translate(2, 2)" />
                      <text x="30" y="15" fill="#0369A1" className="dark:fill-sky-300" fontSize="8" fontWeight="600">Fullscreen Mode Active</text>
                    </g>

                    {/* Assessment Progress Bar */}
                    <g transform="translate(20, 116)">
                      <text x="0" y="10" fill="#475569" className="dark:fill-slate-300" fontSize="9" fontWeight="600">Tech Assessment</text>
                      <text x="150" y="10" textAnchor="end" fill="#0284C7" className="dark:fill-sky-400" fontSize="9" fontWeight="bold">75%</text>
                      <rect x="0" y="16" width="150" height="8" rx="4" fill="#E2E8F0" className="dark:fill-slate-700" />
                      <rect x="0" y="16" width="112" height="8" rx="4" fill="#38BDF8" />
                    </g>

                    {/* Status footer Pill */}
                    <rect x="20" y="168" width="150" height="18" rx="9" fill="#0284C7" fillOpacity="0.1" />
                    <text x="95" y="181" textAnchor="middle" fill="#0284C7" className="dark:fill-sky-400" fontSize="9" fontWeight="600">Secure Test: In Progress</text>
                  </g>
                )}

                {cardIndex === 2 && (
                  <g className="transition-opacity duration-300">
                    {/* CONFIRMED Status Badge */}
                    <rect x="125" y="24" width="52" height="22" rx="11" fill="#8B5CF6" fillOpacity="0.15" />
                    <text x="151" y="39" textAnchor="middle" fill="#7C3AED" className="dark:fill-purple-400" fontSize="8" fontWeight="bold">READY</text>

                    {/* Calendar / Schedule Icon & Details */}
                    <g transform="translate(20, 78)">
                      <rect x="0" y="0" width="34" height="34" rx="8" fill="#F3E8FF" className="dark:fill-purple-950/60" stroke="#DDD6FE" strokeWidth="1" />
                      {/* Calendar Icon */}
                      <path d="M10 11H24M10 15H24M12 7V9M22 7V9M9 8H25C25.5 8 26 8.5 26 9V23C26 23.5 25.5 24 25 24H9C8.5 24 8 23.5 8 23V9C8 8.5 8.5 8 9 8Z" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" transform="scale(0.8) translate(2, 2)" />
                      <text x="44" y="14" fill="#1E293B" className="dark:fill-slate-100" fontSize="9" fontWeight="bold">AI Interview</text>
                      <text x="44" y="27" fill="#64748B" className="dark:fill-slate-400" fontSize="8" fontWeight="500">Thu, 2:00 PM (30m)</text>
                    </g>

                    <g transform="translate(20, 126)">
                      <rect x="0" y="0" width="150" height="22" rx="6" fill="#F5F3FF" className="dark:fill-purple-950/40" />
                      <circle cx="12" cy="11" r="3" fill="#10B981" />
                      <text x="22" y="14" fill="#6D28D9" className="dark:fill-purple-300" fontSize="8" fontWeight="600">Confirmed for Thursday, 2:00 PM</text>
                    </g>

                    {/* Status footer Pill */}
                    <rect x="20" y="168" width="150" height="18" rx="9" fill="#7C3AED" fillOpacity="0.1" />
                    <text x="95" y="181" textAnchor="middle" fill="#7C3AED" className="dark:fill-purple-400" fontSize="9" fontWeight="600">Interview Scheduled</text>
                  </g>
                )}
              </g>

              {/* AI Spark Floating Node with Pulse Animation */}
              <g transform="translate(90, 80)" className="animate-sparkle-pulse">
                <circle cx="20" cy="20" r="22" fill="#38BDF8" fillOpacity="0.25" />
                <path d="M20 10L22.5 17.5L30 20L22.5 22.5L20 30L17.5 22.5L10 20L17.5 17.5L20 10Z" fill="#38BDF8" />
              </g>

              {/* Connecting Node Dots */}
              <circle cx="310" cy="110" r="5" fill="#38BDF8" />
              <line x1="280" y1="130" x2="310" y2="110" stroke="#38BDF8" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3 3" />

              <circle cx="90" cy="300" r="6" fill="#10B981" />
              <line x1="90" y1="300" x2="140" y2="280" stroke="#10B981" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3 3" />
            </g>
          </svg>
        </div>

        <div className="mt-6 text-center max-w-xs">
          <h2 className="text-lg font-semibold text-white">Streamline Hiring with AI </h2>
          <p className="text-xs text-sky-100/70 mt-1 leading-relaxed">
            Screen resumes, evaluate skills, and schedule interviews — all automated with AI.
          </p>
        </div>
      </div>

      {/* Footer / Social Proof */}
      <div className="relative z-10 flex items-center justify-between text-xs text-sky-100/60 pt-4 border-t border-white/10">
        <span>© 2026 AI Recruiter Inc.</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          System Operational
        </span>
      </div>
    </div>
  );
}
