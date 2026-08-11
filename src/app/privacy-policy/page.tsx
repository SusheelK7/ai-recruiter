import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-24 text-[#101828] dark:bg-[#0F1420] dark:text-zinc-100 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-200 bg-white/85 p-8 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-white/5 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2E5B8A] dark:text-[#9DC4F0]">Privacy Policy</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Placeholder policy page for now. Add the final legal copy before production launch.
        </p>
        <div className="mt-8">
          <Link href="/" className="inline-flex rounded-full bg-[#2E5B8A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#23486E] dark:bg-[#4A7FC1] dark:hover:bg-[#3B6EB0]">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}