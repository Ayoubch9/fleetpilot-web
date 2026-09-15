import Link from "next/link";
import FreeTools from "./free-tools";

export const metadata = {
  title: "Free Trucking Calculators | FleetPilot",
  description:
    "Free trucking calculators for cost per mile, load profit, owner-operator profit, lease-operator take-home, fuel cost and rate per mile.",
};

export default function ToolsPage() {
  return (
    <main className="fp-marketing min-h-screen bg-[#f7f9fc] text-[#0b1730]">
      <header className="fp-marketing-header">
        <Link href="/" className="fp-marketing-brand">
          <Logo />
          <div>
            <div className="fp-marketing-brand-name">
              Fleet<span>Pilot</span>
            </div>
            <div className="fp-marketing-tagline">Drive smarter. Earn more.</div>
          </div>
        </Link>
        <nav className="fp-marketing-nav">
          <Link href="/#features">Features</Link>
          <Link href="/tools">Free Tools</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/#about">About</Link>
        </nav>
        <div className="fp-marketing-header-actions">
          <Link href="/login" className="fp-marketing-button secondary">Sign In</Link>
          <Link href="/signup" className="fp-marketing-button primary">Start Free</Link>
        </div>
      </header>

      <section className="fp-tools-public-hero">
        <span>FREE TOOLS FOR TRUCKERS</span>
        <h1>Know the number before you make the decision.</h1>
        <p>
          Free trucking calculators for owner-operators, lease operators,
          contractor drivers and small fleets. No login, no credit card,
          no spreadsheet required.
        </p>
      </section>

      <section className="fp-tools-public-section">
        <FreeTools />
      </section>

      <section className="fp-tools-public-bottom">
        <span>FROM CALCULATOR TO CONTROL CENTER</span>
        <h2>Stop re-entering the same numbers every week.</h2>
        <p>
          FleetPilot stores the loads, trucks, fuel, maintenance and expenses
          behind these calculations so profitability stays available whenever
          you need it.
        </p>
        <Link href="/signup">Start Your 14-Day Free Trial →</Link>
      </section>
    </main>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 28 28" className="h-8 w-8">
      <path d="M2 14.8 26 2 18.2 26l-4.7-9.2L2 14.8Z" fill="#1188ff" />
      <path d="m13.5 16.8 5.2-7.1" fill="none" stroke="#9fd2ff" strokeWidth="1.5" />
    </svg>
  );
}
