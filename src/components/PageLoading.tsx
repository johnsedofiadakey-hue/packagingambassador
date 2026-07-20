export function PageLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6 px-6 py-10">
      <div className="h-4 w-32 rounded-full bg-ink-900/8" />
      <div className="h-8 w-64 rounded-full bg-ink-900/8" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-ink-900/8" />
        ))}
      </div>
    </div>
  );
}
