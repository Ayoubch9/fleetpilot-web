import Link from "next/link";
import FreeTools from "./free-tools";

export const metadata = {
  title: "Free Trucking Calculators | MileVoxa",
  description:
    "Free trucking calculators for cost per mile, load profit, owner-operator profit, lease-operator take-home, fuel cost and rate per mile.",
};

export default function ToolsPage() {
  return (
    <main className="mv-tools-page fp-marketing min-h-screen bg-[#f7f9fc] text-[#0b1730]">
      <header className="fp-marketing-header">
        <Link href="/" className="fp-marketing-brand" aria-label="MileVoxa home">
          <img
            src="/branding/milevoxa-logo-full.png"
            width={2000}
            height={612}
            className="mv-marketing-logo"
            alt="MileVoxa — Run your trucking business with clarity."
          />
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
          MileVoxa stores the loads, trucks, fuel, maintenance and expenses
          behind these calculations so profitability stays available whenever
          you need it.
        </p>
        <Link href="/signup">Start Your 14-Day Free Trial →</Link>
      </section>
    </main>
  );
}

