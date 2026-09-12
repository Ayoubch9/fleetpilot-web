import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-[#0b1730]">
      <header className="mx-auto flex max-w-[1420px] items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <div>
            <div className="text-[22px] font-black tracking-[-.045em]">Fleet<span className="text-[#1188ff]">Pilot</span></div>
            <div className="text-[7px] font-black uppercase tracking-[.18em] text-[#7b8da2]">Drive smarter. Earn more.</div>
          </div>
        </Link>
        <nav className="hidden gap-7 text-[11px] font-black text-[#667991] md:flex">
          <a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#about">About</a>
        </nav>
        <div className="flex gap-2">
          <Link href="/login" className="fp-secondary-button">Sign In</Link>
          <Link href="/signup" className="fp-primary-button">Get Started</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1420px] overflow-hidden rounded-[18px] border border-[#e0e8f0] bg-[#f8fbff] lg:grid-cols-[.9fr_1.1fr]">
        <div className="flex flex-col justify-center px-8 py-16 lg:px-14">
          <div className="text-[9px] font-black uppercase tracking-[.2em] text-[#1188ff]">FleetPilot Control Center</div>
          <h1 className="mt-5 text-5xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl">
            Control Your Miles.<br /><span className="text-[#1188ff]">Grow Your Business.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-7 text-[#687b92]">
            The all-in-one platform for owner-operators and small fleets. Track loads, expenses, maintenance, fuel and real profit in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="fp-primary-button px-6 py-3.5">Get Started →</Link>
            <Link href="/login" className="fp-secondary-button px-6 py-3.5">Open Web App</Link>
          </div>
        </div>

        <div className="relative min-h-[520px] bg-[url('/fleetpilot-hero-banner.jpg')] bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-r from-[#f8fbff] via-transparent to-transparent" />
          <div className="absolute bottom-10 right-10 text-right text-[13px] font-black uppercase tracking-[.3em] text-white drop-shadow-lg">
            Drive<br />Smarter.<br />Earn More.
            <div className="ml-auto mt-3 h-[3px] w-12 bg-[#1188ff]" />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1420px] px-6 py-20 lg:px-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Loads","Track every load and see real profitability."],
            ["Expenses","Know exactly where your money goes."],
            ["Maintenance","Plan service before it becomes downtime."],
            ["Analytics","Understand revenue, cost and profit per mile."],
          ].map(([t,d],i)=>(
            <div key={t} className="fp-card rounded-[14px] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#e5f2ff] text-[#1188ff] font-black">{i+1}</div>
              <div className="mt-6 text-[18px] font-black">{t}</div>
              <div className="mt-2 text-[12px] leading-5 text-[#6b7e94]">{d}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Logo(){
  return <svg viewBox="0 0 28 28" className="h-8 w-8"><path d="M2 14.8 26 2 18.2 26l-4.7-9.2L2 14.8Z" fill="#1188ff"/><path d="m13.5 16.8 5.2-7.1" fill="none" stroke="#9fd2ff" strokeWidth="1.5"/></svg>;
}
