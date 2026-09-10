"use client";

import React, { useState } from "react";
import { FeatureGate } from "@/components/billing/FeatureGate";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function ChatbotSettingsPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your AI Recruiter Assistant. I can help draft interview questions, summarize applicant skill profiles, or optimize job postings. What would you like help with today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error || "Unable to reach the assistant. Please verify your subscription status.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error communicating with the AI Recruiter Chatbot.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            AI Recruiter Chatbot & Talent Co-Pilot
          </h3>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Interactive candidate screening assistant powered by Google Gemini.
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          Online
        </span>
      </div>

      {/* Chat Messages Container */}
      <div className="mt-4 max-h-[320px] min-h-[220px] space-y-3 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-zinc-50/50 p-4 dark:bg-zinc-900/30">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-primary)] shadow-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-2.5 text-xs text-[var(--text-muted)] shadow-sm">
              <span className="h-2 w-2 animate-ping rounded-full bg-violet-500"></span>
              Thinking with Gemini...
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or request candidate screening tips..."
          className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-2.5 text-xs text-[var(--text-primary)] focus:border-violet-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Account & AI Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Configure company workspace preferences and recruiter AI intelligence tools.
        </p>
      </div>

      {/* General Settings Card */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-6 shadow-sm">
        <h3 className="text-base font-bold text-[var(--text-primary)]">
          Workspace Notifications & Defaults
        </h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Email alerts and candidate assessment defaults for your recruiting team.
        </p>

        <div className="mt-6 space-y-4 text-xs">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="text-[var(--text-primary)]">
              Email recruiters whenever a new application is submitted
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="text-[var(--text-primary)]">
              Notify candidates automatically upon scoring their technical assessment
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="text-[var(--text-primary)]">
              Flag anti-cheat security violations (tab switching) in real time
            </span>
          </label>
        </div>
      </div>

      {/* Chatbot Gated Section */}
      <FeatureGate
        feature="chatbot"
        fallbackTitle="AI Recruiter Screening Chatbot"
        fallbackDescription="Empower your team with a 24/7 AI recruiter assistant that drafts rubrics and screens talent instantly."
      >
        <ChatbotSettingsPanel />
      </FeatureGate>
    </div>
  );
}
