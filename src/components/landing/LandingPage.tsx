"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PublicNavbar } from "../layout/PublicNavbar";
import { ScrollReveal } from "../ui/ScrollReveal";

type SectionKey = "features" | "how-it-works" | "pricing";

const howItWorks = [
  {
    title: "Post a job",
    description: "Publish a role in minutes and invite candidates into a single streamlined hiring flow.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10M4 18h7" />
      </svg>
    ),
  },
  {
    title: "Candidates apply",
    description: "Applicants submit resumes, short video introductions, and assessment responses in one place.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11.5V8a4 4 0 10-8 0v3.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12.5h12l-1 8H7l-1-8z" />
      </svg>
    ),
  },
  {
    title: "AI screens & ranks",
    description: "AI scores resumes, highlights reasoning, and surfaces the best-fit candidates first.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l1.8 5.4L19 9.2l-4.6 3.2L16.2 18 12 14.9 7.8 18l1.8-5.6L5 9.2l5.2-1.8L12 2z" />
      </svg>
    ),
  },
  {
    title: "You hire",
    description: "Move the strongest applicants into tests, interviews, and offers without extra tooling.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8 8-4-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h2m10 10h2" />
      </svg>
    ),
  },
];

const features = [
  {
    title: "AI Resume Screening",
    description: "Automate first-pass review and surface the strongest applicants with match scores and clear reasoning.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l2 2v14H5V4h2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h8M8 13h8M8 17h5" />
      </svg>
    ),
  },
  {
    title: "Secure Proctored Testing",
    description: "Lock down assessments with fullscreen testing, timing controls, and anti-tamper safeguards included.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.8 1.8L15 10.2" />
      </svg>
    ),
  },
  {
    title: "AI Video Introduction",
    description: "Capture concise candidate intros and transcribe them for review without storing the raw video long term.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h10v10H4V7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l6-3v10l-6-3v-4z" />
      </svg>
    ),
  },
  {
    title: "AI Interview Questions",
    description: "Generate targeted interview prompts from the job requirements, candidate profile, and skill gaps.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v11H8l-4 4V5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h8M8 12h5" />
      </svg>
    ),
  },
  {
    title: "Analytics & Skill-Gap Insights",
    description: "See where candidates excel, where they fall short, and which roles need the least manual review.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 15v-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-6" />
      </svg>
    ),
  },
];

const whyUs = [
  "Self-serve signup with no sales calls or implementation project required.",
  "Transparent AI reasoning keeps recruiters in control of every decision.",
  "Secure testing is included, not hidden behind a paid add-on.",
  "Flat-rate pricing keeps costs predictable as your team grows.",
];

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For teams exploring AI-assisted hiring.",
    href: "/register?plan=free",
    bullets: ["1 active job", "Resume screening", "Basic candidate pipeline"],
  },
  {
    name: "Pro",
    price: "$49",
    description: "For growing teams that want the full screening workflow.",
    href: "/register?plan=pro",
    bullets: ["Unlimited jobs", "Secure testing", "AI video intro transcripts", "Priority analytics"],
    popular: true,
  },
  {
    name: "Business",
    price: "$129",
    description: "For recruiting teams that need collaboration and scale.",
    href: "/register?plan=business",
    bullets: ["Advanced insights", "Team collaboration", "Dedicated onboarding support"],
  },
];

const faqs = [
  {
    question: "Is there a free plan?",
    answer: "Yes. You can start on the Free plan and upgrade anytime once you need more jobs or more automation.",
  },
  {
    question: "Do you store candidate videos?",
    answer: "We keep the workflow privacy-friendly by focusing on the transcript and review data rather than long-term video storage.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. Plans are self-serve and you can change or cancel without talking to sales.",
  },
  {
    question: "How does AI screening work?",
    answer: "The platform compares the job requirements against resume signals, shows reasoning, and ranks candidates by fit.",
  },
  {
    question: "Is secure testing included?",
    answer: "Yes. Proctored testing is part of the product, not an expensive add-on.",
  },
  {
    question: "Does the platform help with interviews?",
    answer: "It can generate interview questions and help you schedule the next step for high-fit candidates.",
  },
];

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2E5B8A] dark:text-[#7CA8D8]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#101828] dark:text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">{description}</p>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden rounded-[32px] border border-white/55 bg-gradient-to-br from-[#2E5B8A] via-[#244A72] to-[#1B3654] p-4 shadow-2xl dark:border-white/10 dark:from-[#1B324D] dark:via-[#16273C] dark:to-[#0F1A28] sm:p-6">
      <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />

      <div className="relative rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-xl sm:p-5">
        <div className="flex items-start justify-between gap-4 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/70">AI screening</p>
            <h3 className="mt-2 text-xl font-bold sm:text-2xl">Senior Product Designer</h3>
            <p className="mt-1 text-sm text-sky-100/75">7 candidates queued for screening</p>
          </div>
          <div className="rounded-2xl bg-emerald-400/15 px-4 py-3 text-right text-white ring-1 ring-emerald-300/30">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">Top match</p>
            <p className="text-2xl font-bold">98%</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/15 bg-white/95 p-4 text-zinc-900 shadow-lg dark:bg-zinc-950/95 dark:text-zinc-50">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2E5B8A]/10 text-[#2E5B8A] dark:bg-[#4A7FC1]/15 dark:text-[#9DC4F0]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 10-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">Jordan Lee</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">AI fit score: 98%</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Product thinking</span>
                  <span>95%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div className="h-2 w-[95%] rounded-full bg-[#2E5B8A] dark:bg-[#4A7FC1]" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Design systems</span>
                  <span>91%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div className="h-2 w-[91%] rounded-full bg-emerald-500" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Interview readiness</span>
                  <span>88%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div className="h-2 w-[88%] rounded-full bg-amber-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/70">Secure testing</p>
              <p className="mt-2 text-lg font-semibold">Fullscreen proctoring active</p>
              <p className="mt-1 text-sm text-sky-100/75">Protected assessments built into the workflow.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/70">Scheduling</p>
              <p className="mt-2 text-lg font-semibold">AI interview ready</p>
              <p className="mt-1 text-sm text-sky-100/75">Questions, transcript, and next steps in one place.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function iconCard(icon: React.ReactNode) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2E5B8A]/10 text-[#2E5B8A] dark:bg-[#4A7FC1]/15 dark:text-[#9DC4F0]">
      {icon}
    </div>
  );
}

function buttonLinkClasses(variant: "primary" | "secondary") {
  if (variant === "primary") {
    return [
      "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200",
      "bg-[#2E5B8A] text-white shadow-sm hover:bg-[#23486E] active:scale-[0.98]",
      "dark:bg-[#4A7FC1] dark:hover:bg-[#3B6EB0]",
    ].join(" ");
  }

  return [
    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200",
    "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 active:scale-[0.98]",
    "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
  ].join(" ");
}

export function LandingPage() {
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);

  useEffect(() => {
    const sectionIds: SectionKey[] = ["how-it-works", "features", "pricing"];

    // Track intersecting sections to pick the one highest on screen
    const intersectingSet = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersectingSet.add(entry.target.id);
          } else {
            intersectingSet.delete(entry.target.id);
          }
        });

        // Pick first match in top-to-bottom order
        const priority: SectionKey[] = ["how-it-works", "features", "pricing"];
        const next = priority.find((id) => intersectingSet.has(id)) ?? null;
        setActiveSection(next as SectionKey | null);
      },
      // A section is considered "in view" when it occupies the middle band of the viewport
      { threshold: 0, rootMargin: "-20% 0px -50% 0px" }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = (key: SectionKey) => {
    setActiveSection(key);
  };

  return (
    <main className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(46,91,138,0.12),_transparent_35%),linear-gradient(180deg,_#F8FAFC_0%,_#FFFFFF_38%,_#EEF3F8_100%)] text-[#101828] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,_rgba(74,127,193,0.16),_transparent_35%),linear-gradient(180deg,_#0F1420_0%,_#101624_38%,_#0B111B_100%)] dark:text-zinc-100">
      <PublicNavbar activeSection={activeSection} onNavClick={handleNavClick} />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pt-28 sm:px-6 lg:px-8 lg:pt-36">
        <section className="grid items-center gap-14 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-16">
          <ScrollReveal direction="up" durationMs={550}>
            <div className="max-w-2xl">
              <p className="inline-flex items-center rounded-full border border-[#2E5B8A]/15 bg-[#2E5B8A]/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#2E5B8A] dark:border-[#4A7FC1]/20 dark:bg-[#4A7FC1]/12 dark:text-[#9DC4F0]">
                AI Recruiter for modern hiring teams
              </p>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-[#101828] dark:text-white sm:text-5xl lg:text-6xl">
                Hire smarter with AI-powered screening
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
                Screen resumes with explainable AI, run secure candidate tests, and schedule interviews in one platform.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={buttonLinkClasses("primary")}>
                  Get Started Free
                </Link>
                <a href="#how-it-works" className={buttonLinkClasses("secondary")}>
                  See how it works
                </a>
              </div>

              <div className="mt-8 grid max-w-xl gap-3 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 bg-white/75 p-4 backdrop-blur dark:border-zinc-800 dark:bg-white/5">
                  <p className="font-semibold text-[#101828] dark:text-white">Explainable AI</p>
                  <p className="mt-1">See why a candidate matched before you decide.</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white/75 p-4 backdrop-blur dark:border-zinc-800 dark:bg-white/5">
                  <p className="font-semibold text-[#101828] dark:text-white">Secure by default</p>
                  <p className="mt-1">Testing and interview steps stay in one place.</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white/75 p-4 backdrop-blur dark:border-zinc-800 dark:bg-white/5">
                  <p className="font-semibold text-[#101828] dark:text-white">Built for speed</p>
                  <p className="mt-1">Go from posting to shortlist without manual triage.</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" durationMs={550} staggerIndex={1} staggerDelayMs={120}>
            <div className="relative">
              <HeroPreview />
            </div>
          </ScrollReveal>
        </section>

        <section id="how-it-works" className="scroll-mt-28 sm:scroll-mt-36 py-12 sm:py-16">
          <ScrollReveal direction="up" durationMs={500}>
            <SectionHeading
              eyebrow="How It Works"
              title="A simple hiring workflow"
              description="Go from job posting to a shortlist of strong candidates without juggling separate tools."
            />
          </ScrollReveal>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {howItWorks.map((step, index) => (
              <ScrollReveal key={step.title} staggerIndex={index} staggerDelayMs={90}>
                <article className="h-full rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur transition-transform duration-200 hover:-translate-y-1 dark:border-zinc-800 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    {iconCard(step.icon)}
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#101828] dark:text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{step.description}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <section id="features" className="scroll-mt-28 sm:scroll-mt-36 py-12 sm:py-16">
          <ScrollReveal direction="up" durationMs={500}>
            <SectionHeading
              eyebrow="Features"
              title="Everything needed for modern recruiting"
              description="Keep AI-assisted screening, testing, transcription, and analytics together in one clean workflow."
            />
          </ScrollReveal>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} staggerIndex={index} staggerDelayMs={90}>
                <article className="h-full rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur transition-all duration-200 hover:border-[#2E5B8A]/25 hover:shadow-lg dark:border-zinc-800 dark:bg-white/5">
                  {iconCard(feature.icon)}
                  <h3 className="mt-4 text-lg font-semibold text-[#101828] dark:text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{feature.description}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <section className="scroll-mt-28 sm:scroll-mt-36 py-12 sm:py-16">
          <ScrollReveal direction="up" durationMs={500}>
            <SectionHeading
              eyebrow="Why AI Recruiter"
              title="A cleaner alternative to fragmented hiring stacks"
              description="Made for recruiters who want clarity, speed, and security without hidden enterprise complexity."
            />
          </ScrollReveal>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {whyUs.map((point, index) => (
              <ScrollReveal key={point} staggerIndex={index} staggerDelayMs={90}>
                <div className="h-full rounded-3xl border border-zinc-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-white/5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{point}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <section id="pricing" className="scroll-mt-28 sm:scroll-mt-36 py-12 sm:py-16">
          <ScrollReveal direction="up" durationMs={500}>
            <SectionHeading
              eyebrow="Pricing"
              title="Choose the plan that fits your hiring volume"
              description="Start free, upgrade when you need more automation, and keep pricing predictable as your team grows."
            />
          </ScrollReveal>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <ScrollReveal key={plan.name} staggerIndex={index} staggerDelayMs={100}>
                <article
                  className={`relative h-full rounded-3xl border p-6 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-1 ${plan.popular
                    ? "border-[#2E5B8A]/25 bg-[#2E5B8A]/5 dark:border-[#4A7FC1]/35 dark:bg-[#4A7FC1]/10"
                    : "border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-white/5"
                    }`}
                >
                  {plan.popular ? (
                    <span className="absolute right-6 top-6 rounded-full bg-[#2E5B8A] px-3 py-1 text-xs font-semibold text-white dark:bg-[#4A7FC1]">
                      Most Popular
                    </span>
                  ) : null}
                  <div className="pr-20">
                    <h3 className="text-lg font-semibold text-[#101828] dark:text-white">{plan.name}</h3>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{plan.description}</p>
                  </div>
                  <div className="mt-6 flex items-end gap-2">
                    <span className="text-4xl font-bold tracking-tight text-[#101828] dark:text-white">{plan.price}</span>
                    <span className="pb-1 text-sm text-zinc-500 dark:text-zinc-400">/mo</span>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {plan.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2E5B8A]/10 text-[#2E5B8A] dark:bg-[#4A7FC1]/15 dark:text-[#9DC4F0]">
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                          </svg>
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link href={plan.href} className={buttonLinkClasses(plan.popular ? "primary" : "secondary") + " w-full"}>
                      Get started
                    </Link>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <section className="scroll-mt-28 sm:scroll-mt-36 py-12 sm:py-16">
          <ScrollReveal direction="up" durationMs={500}>
            <SectionHeading
              eyebrow="FAQ"
              title="Common questions, answered"
              description="Get a quick read on how the platform works before you sign up."
            />
          </ScrollReveal>

          <div className="mx-auto mt-10 max-w-4xl space-y-3">
            {faqs.map((faq, index) => (
              <ScrollReveal key={faq.question} staggerIndex={index} staggerDelayMs={80}>
                <details
                  className="group rounded-3xl border border-zinc-200 bg-white/80 p-5 shadow-sm backdrop-blur open:border-[#2E5B8A]/20 dark:border-zinc-800 dark:bg-white/5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-[#101828] outline-none dark:text-white">
                    {faq.question}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-transform duration-200 group-open:rotate-45 dark:bg-zinc-800 dark:text-zinc-300">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">{faq.answer}</p>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <ScrollReveal direction="up" durationMs={500}>
            <div className="rounded-[32px] border border-[#2E5B8A]/15 bg-gradient-to-br from-[#2E5B8A] via-[#244A72] to-[#1B3654] px-6 py-10 text-center text-white shadow-2xl dark:border-white/10 dark:from-[#1B324D] dark:via-[#16273C] dark:to-[#0F1A28] sm:px-10 sm:py-14">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to hire smarter? Get started free</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-sky-100/80 sm:text-base">
                Launch your first job, screen candidates with AI, and bring secure testing into the same workflow.
              </p>
              <div className="mt-8 flex justify-center">
                <Link href="/register" className={buttonLinkClasses("primary") + " px-6 py-3 text-base"}>
                  Get Started Free
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>

        <footer className="border-t border-zinc-200/70 pb-8 pt-8 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 font-semibold text-[#101828] dark:text-white">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#2E5B8A]/10 text-[#2E5B8A] dark:bg-[#4A7FC1]/15 dark:text-[#9DC4F0]">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l7 4v12l-7 4-7-4V6l7-4z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
                  </svg>
                </span>
                AI Recruiter
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/#features" className="hover:text-[#2E5B8A] dark:hover:text-[#9DC4F0]">
                Features
              </Link>
              <Link href="/#how-it-works" className="hover:text-[#2E5B8A] dark:hover:text-[#9DC4F0]">
                How It Works
              </Link>
              <Link href="/#pricing" className="hover:text-[#2E5B8A] dark:hover:text-[#9DC4F0]">
                Pricing
              </Link>
              <Link href="/privacy-policy" className="hover:text-[#2E5B8A] dark:hover:text-[#9DC4F0]">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[#2E5B8A] dark:hover:text-[#9DC4F0]">
                Terms
              </Link>
            </div>
          </div>
          <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
            © 2026 AI Recruiter. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}