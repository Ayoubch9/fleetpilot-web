import Link from "next/link";

const included = [
  "Dashboard & weekly performance",
  "Loads, trucks and expenses",
  "Fuel analytics",
  "Maintenance tracking",
  "Reimbursements",
  "Weekly settlement",
  "Reports & data export",
  "Documents & expiration alerts",
  "Pilot AI",
  "Operational notifications",
  "Web + mobile account",
];

export default function PricingPage() {
  return (
    <main className="fp-marketing fp-pricing-page min-h-screen bg-[#f7f9fc] text-[#0b1730]">
      <header className="fp-marketing-header">
        <Link href="/" className="fp-marketing-brand">
          <Logo />
          <div>
            <div className="fp-marketing-brand-name">Fleet<span>Pilot</span></div>
            <div className="fp-marketing-tagline">Drive smarter. Earn more.</div>
          </div>
        </Link>

        <nav className="fp-marketing-nav">
          <Link href="/#features">Features</Link>
          <Link href="/pricing" className="active">Pricing</Link>
          <Link href="/#about">About</Link>
        </nav>

        <div className="fp-marketing-header-actions">
          <Link href="/login" className="fp-marketing-button secondary">Sign In</Link>
          <Link href="/signup" className="fp-marketing-button primary">Start Free</Link>
        </div>
      </header>

      <section className="fp-pricing-hero">
        <span>Simple FleetPilot pricing</span>
        <h1>Start with the product.<br />Decide with your own numbers.</h1>
        <p>
          Every new FleetPilot account starts with a 14-day free trial. No card is
          required to test the workflow with your own loads, costs and fleet data.
        </p>
      </section>

      <section className="fp-pricing-layout">
        <article className="fp-pricing-card">
          <div className="fp-pricing-popular">14-DAY FREE TRIAL</div>
          <div className="fp-pricing-card-head">
            <div>
              <span>FleetPilot Pro</span>
              <h2>$29<span>/month</span></h2>
              <p>Planned launch pricing after the free trial.</p>
            </div>
            <div className="fp-pricing-trial-badge">
              <strong>$0 today</strong>
              <span>No card required</span>
            </div>
          </div>

          <div className="fp-pricing-included">
            <span>Everything you need to run the operation:</span>
            <div>
              {included.map((item) => (
                <p key={item}><i>✓</i>{item}</p>
              ))}
            </div>
          </div>

          <Link href="/signup" className="fp-marketing-button primary pricing">
            Start 14-Day Free Trial <span>→</span>
          </Link>
          <small>Cancel before paid billing begins. Billing activation will be shown clearly before a paid subscription starts.</small>
        </article>

        <aside className="fp-pricing-side">
          <div className="fp-pricing-side-card">
            <span>THE TRIAL</span>
            <h3>Use FleetPilot like a real operating week.</h3>
            <ol>
              <li><b>01</b><div><strong>Add your trucks</strong><span>Set up the fleet you actually run.</span></div></li>
              <li><b>02</b><div><strong>Track real loads</strong><span>Use manual entry or Telegram load import.</span></div></li>
              <li><b>03</b><div><strong>Add fuel & expenses</strong><span>Build the true cost picture.</span></div></li>
              <li><b>04</b><div><strong>Review the week</strong><span>See settlement, profit and cost per mile together.</span></div></li>
            </ol>
          </div>

          <div className="fp-pricing-side-card dark">
            <span>WHY ONE PLAN?</span>
            <h3>No feature maze.</h3>
            <p>
              FleetPilot is built as one connected operating system. Loads are more
              useful when expenses, maintenance, fuel and settlement live beside them,
              so the core product stays together.
            </p>
          </div>
        </aside>
      </section>

      <section className="fp-pricing-compare">
        <div className="fp-marketing-section-heading compact">
          <div>
            <span>What you get</span>
            <h2>More than a load tracker.</h2>
          </div>
          <p>
            FleetPilot is meant to replace the disconnected process around the load—not
            just store load numbers.
          </p>
        </div>

        <div className="fp-pricing-value-grid">
          <ValueCard title="Operations" text="Loads, trucks, documents and maintenance stay connected." />
          <ValueCard title="Financial clarity" text="Expenses, fuel, reimbursements, fees and settlement show the real weekly result." />
          <ValueCard title="Decision support" text="Reports, alerts, comparisons and Pilot AI help turn operating history into action." />
        </div>
      </section>

      <section className="fp-marketing-final-cta">
        <div>
          <span>Start without a card</span>
          <h2>Give FleetPilot one real week of your data.</h2>
          <p>You will know quickly whether having the operation in one place changes the way you run it.</p>
        </div>
        <div>
          <Link href="/signup" className="fp-marketing-button primary large">Start Free Trial →</Link>
          <Link href="/" className="fp-marketing-button ghost large">Back to Home</Link>
        </div>
      </section>
    </main>
  );
}

function ValueCard({ title, text }: { title: string; text: string }) {
  return <article><span>✓</span><h3>{title}</h3><p>{text}</p></article>;
}

function Logo() {
  return (
    <svg viewBox="0 0 28 28" className="h-8 w-8">
      <path d="M2 14.8 26 2 18.2 26l-4.7-9.2L2 14.8Z" fill="#1188ff" />
      <path d="m13.5 16.8 5.2-7.1" fill="none" stroke="#9fd2ff" strokeWidth="1.5" />
    </svg>
  );
}
