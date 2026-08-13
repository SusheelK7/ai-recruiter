export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="dashboard-card max-w-md rounded-2xl p-8">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{title}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          This section is coming soon. Use the Dashboard to manage your hiring pipeline.
        </p>
      </div>
    </div>
  );
}
