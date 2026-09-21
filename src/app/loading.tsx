export default function Loading() {
  return (
    <main className="min-h-screen bg-[#F7F9F8]">
      <aside className="fixed inset-y-0 left-0 hidden w-[222px] bg-gradient-to-b from-[#102238] to-[#0B1730] lg:block">
        <div className="p-5">
          <div className="h-8 w-32 animate-pulse rounded bg-white/10" />
        </div>
        <div className="space-y-2 px-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={index}
              className="h-9 animate-pulse rounded-[8px] bg-white/[.055]"
            />
          ))}
        </div>
      </aside>

      <section className="min-h-screen lg:ml-[222px]">
        <header className="h-[68px] border-b border-[#e0e8f0] bg-white" />
        <div className="fp-production-loading">
          <div className="fp-loading-hero" />
          <div className="fp-loading-kpis">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="fp-loading-card" />
            ))}
          </div>
          <div className="fp-loading-main">
            <div className="fp-loading-panel" />
            <div className="fp-loading-panel" />
          </div>
        </div>
      </section>
    </main>
  );
}
