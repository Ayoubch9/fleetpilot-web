import Link from "next/link";

const features = [
  {
    icon: "truck",
    title: "Loads & Profitability",
    text: "Track every load, rate, loaded mile and deadhead mile. See revenue and direct profit by load, week or month.",
  },
  {
    icon: "expense",
    title: "Expenses & Fuel",
    text: "Record fuel and operating costs, organize categories, attach them to trucks and understand where the money goes.",
  },
  {
    icon: "tool",
    title: "Maintenance",
    text: "Track service history, mileage thresholds and upcoming maintenance before small problems become expensive downtime.",
  },
  {
    icon: "settlement",
    title: "Weekly Settlement",
    text: "Bring revenue, expenses, reimbursements, fixed costs and company fees together in one weekly business view.",
  },
  {
    icon: "fuel",
    title: "Fuel Analytics",
    text: "Watch fuel cost, gallons, average price, MPG and truck-level fuel performance from real fleet data.",
  },
  {
    icon: "ai",
    title: "Pilot AI",
    text: "Ask questions about loads, fuel, expenses and profitability using the operational data already inside FleetPilot.",
  },
  {
    icon: "document",
    title: "Documents & Compliance",
    text: "Keep important fleet documents organized and surface expiration dates before they become an operational problem.",
  },
  {
    icon: "report",
    title: "Reports & Export",
    text: "Turn your operating history into useful reports and exports for reviews, planning and better business decisions.",
  },
];

const outcomes = [
  ["Know the real number", "Stop judging a week by gross revenue alone. See what remains after the costs that actually run the truck."],
  ["Catch problems sooner", "Maintenance due, expiring documents and operational alerts stay visible instead of living across notes and messages."],
  ["Run one system", "Loads, trucks, fuel, expenses, maintenance and settlement data stay connected instead of being spread across spreadsheets."],
];

export default function HomePage() {
  return (
    <main className="fp-marketing min-h-screen bg-white text-[#0b1730]">
      <header className="fp-marketing-header">
        <Link href="/" className="fp-marketing-brand" aria-label="FleetPilot home">
          <Logo />
          <div>
            <div className="fp-marketing-brand-name">
              Fleet<span>Pilot</span>
            </div>
            <div className="fp-marketing-tagline">Drive smarter. Earn more.</div>
          </div>
        </Link>

        <nav className="fp-marketing-nav" aria-label="Main navigation">
          <a href="#features">Features</a>
          <Link href="/tools">Free Tools</Link>
          <Link href="/pricing">Pricing</Link>
          <a href="#about">About</a>
        </nav>

        <div className="fp-marketing-header-actions">
          <Link href="/login" className="fp-marketing-button secondary">Sign In</Link>
          <Link href="/signup" className="fp-marketing-button primary">Start Free</Link>
        </div>
      </header>

      <section className="fp-marketing-hero">
        <div className="fp-marketing-hero-copy">
          <div className="fp-marketing-eyebrow">FleetPilot Control Center</div>

          <h1>
            Control Your Miles.
            <span>Grow Your Business.</span>
          </h1>

          <p>
            One operating system for owner-operators and small fleets. Manage loads,
            expenses, fuel, maintenance, documents and weekly profit from one connected
            control center.
          </p>

          <div className="fp-marketing-trial-pill">
            <span>14 DAYS FREE</span>
            <strong>No card required to start</strong>
          </div>

          <div className="fp-marketing-hero-actions">
            <Link href="/signup" className="fp-marketing-button primary large">
              Start 14-Day Free Trial <span>→</span>
            </Link>
            <Link href="/login" className="fp-marketing-button secondary large">
              Open Web App
            </Link>
          </div>

          <div className="fp-marketing-hero-proof">
            <span>✓ Web + mobile account</span>
            <span>✓ Real weekly profit</span>
            <span>✓ Built for trucking operations</span>
          </div>
        </div>

        <div className="fp-marketing-hero-visual">
          <img
            src="https://images.pexels.com/photos/27099095/pexels-photo-27099095.jpeg?auto=compress&cs=tinysrgb&w=2400"
            alt="Semi truck on the road"
            loading="eager"
            fetchPriority="high"
          />
          <div className="fp-marketing-hero-fade" />
          <div className="fp-marketing-road-copy">
            <strong>DRIVE SMARTER.</strong>
            <strong>EARN MORE.</strong>
            <span />
          </div>

        </div>
      </section>

      <section className="fp-marketing-trust-strip" aria-label="FleetPilot value">
        <div>
          <strong>One place</strong>
          <span>for the operating numbers that matter</span>
        </div>
        <div>
          <strong>Weekly clarity</strong>
          <span>instead of month-end surprises</span>
        </div>
        <div>
          <strong>Real fleet data</strong>
          <span>not disconnected spreadsheets</span>
        </div>
        <div>
          <strong>14 days free</strong>
          <span>to test the workflow yourself</span>
        </div>
      </section>

      <section id="features" className="fp-marketing-section">
        <div className="fp-marketing-section-heading">
          <div>
            <span>Everything connected</span>
            <h2>Run the business behind the truck.</h2>
          </div>
          <p>
            FleetPilot is designed around the work owner-operators and small fleets
            already do every week—then connects it so profitability becomes easier to
            see and easier to act on.
          </p>
        </div>

        <div className="fp-marketing-feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="fp-marketing-feature-card">
              <div className={`fp-marketing-feature-icon ${feature.icon}`}>
                <MarketingIcon type={feature.icon} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fp-marketing-dark-section">
        <div className="fp-marketing-dark-copy">
          <span>From gross revenue to real business performance</span>
          <h2>Know what the truck actually makes.</h2>
          <p>
            Gross revenue can look good while fuel, maintenance, reimbursements,
            company fees and fixed weekly costs quietly reduce the result. FleetPilot
            puts those pieces into the same operating view.
          </p>

          <div className="fp-marketing-outcomes">
            {outcomes.map(([title, body]) => (
              <div key={title}>
                <i>✓</i>
                <div>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="fp-marketing-control-preview">
          <div className="fp-preview-top">
            <span>WEEKLY CONTROL CENTER</span>
            <b>LIVE BUSINESS VIEW</b>
          </div>
          <div className="fp-preview-metrics">
            <PreviewMetric label="Gross Revenue" value="$24,580" tone="blue" />
            <PreviewMetric label="Total Costs" value="$16,241" tone="red" />
            <PreviewMetric label="Net Profit" value="$8,339" tone="green" />
          </div>
          <div className="fp-preview-chart">
            {[43, 58, 49, 72, 63, 84, 69, 92, 76, 88, 67, 96].map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="fp-preview-bottom">
            <span>Loads</span>
            <span>Fuel</span>
            <span>Maintenance</span>
            <span>Fees</span>
            <span>Profit</span>
          </div>
        </div>
      </section>

      <section id="about" className="fp-marketing-section fp-marketing-about">
        <div className="fp-marketing-about-card">
          <div className="fp-marketing-eyebrow">Why FleetPilot</div>
          <h2>Built around a simple problem: trucking data is everywhere.</h2>
          <p>
            Loads arrive through dispatch messages. Fuel lives in receipts. Maintenance
            is remembered by mileage. Expenses sit in separate apps or spreadsheets.
            At the end of the week, the most important question is still difficult:
            <strong> what did the truck actually make?</strong>
          </p>
          <p>
            FleetPilot brings those operating pieces together for owner-operators and
            small fleets that want a clearer way to run the business—not just move the truck.
          </p>
        </div>

        <div className="fp-marketing-about-points">
          <AboutPoint number="01" title="For owner-operators" text="See the business behind every mile without building a spreadsheet system from scratch." />
          <AboutPoint number="02" title="For small fleets" text="Keep trucks, loads, expenses, maintenance and documents organized under one company account." />
          <AboutPoint number="03" title="For better decisions" text="Use real operating history to compare weeks, understand costs and decide what needs attention next." />
        </div>
      </section>

      <section className="fp-marketing-free-tools-preview">
        <div>
          <span>Free trucking calculators</span>
          <h2>Useful before you ever create an account.</h2>
          <p>
            Calculate load profit, rate per mile, cost per mile, fuel spend,
            owner-operator profit and lease-operator take-home with
            FleetPilot&apos;s free tools.
          </p>
        </div>
        <Link href="/tools" className="fp-marketing-button primary large">
          Open Free Tools <span>→</span>
        </Link>
      </section>

      <section className="fp-marketing-pricing-preview">
        <div>
          <span>Simple subscription</span>
          <h2>Try the full FleetPilot workflow for 14 days.</h2>
          <p>
            Start with the product, add your own loads and costs, and decide whether
            FleetPilot earns a place in your weekly operation.
          </p>
        </div>

        <div className="fp-marketing-pricing-preview-card">
          <div>
            <small>FLEETPILOT PRO</small>
            <strong>14 days free</strong>
            <span>No card required during the trial</span>
          </div>
          <ul>
            <li>Loads, trucks and expenses</li>
            <li>Fuel & maintenance analytics</li>
            <li>Weekly settlement & reports</li>
            <li>Pilot AI & operational alerts</li>
          </ul>
          <div className="fp-marketing-pricing-buttons">
            <Link href="/signup" className="fp-marketing-button primary large">
              Start Free Trial
            </Link>
            <Link href="/pricing" className="fp-marketing-button secondary large">
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="fp-marketing-faq fp-marketing-section">
        <div className="fp-marketing-section-heading compact">
          <div>
            <span>Before you start</span>
            <h2>Common questions.</h2>
          </div>
        </div>

        <div className="fp-marketing-faq-grid">
          <Faq q="Do I need a credit card for the trial?" a="No. You can create your FleetPilot account and use the 14-day trial without entering card details." />
          <Faq q="Is FleetPilot only for large fleets?" a="No. The product is designed around owner-operators and small fleets that need clear operating and profitability data without enterprise complexity." />
          <Faq q="Can I use the same account on web and mobile?" a="Yes. FleetPilot is designed around the same account and Supabase company data so the web and mobile experiences can stay connected." />
          <Faq q="Can FleetPilot track more than revenue?" a="Yes. Loads, fuel, expenses, maintenance, reimbursements, fixed weekly costs and fee settings feed the operating and settlement views." />
          <Faq q="What happens after the trial?" a="You can choose the FleetPilot subscription when paid billing is activated. Your operating data remains tied to your account." />
          <Faq q="Can I import dispatcher load information?" a="Yes. FleetPilot includes a Telegram-style load importer that can read common dispatch message fields and prefill a new load." />
        </div>
      </section>

      <section className="fp-marketing-final-cta">
        <div>
          <span>14-day free trial</span>
          <h2>Put your next week of trucking data in one place.</h2>
          <p>No card required. Start with real loads, real costs and your own operation.</p>
        </div>
        <div>
          <Link href="/signup" className="fp-marketing-button primary large">
            Start Free Trial <span>→</span>
          </Link>
          <Link href="/login" className="fp-marketing-button ghost large">
            Sign In
          </Link>
        </div>
      </section>

      <footer className="fp-marketing-footer">
        <Link href="/" className="fp-marketing-brand">
          <Logo />
          <div>
            <div className="fp-marketing-brand-name">Fleet<span>Pilot</span></div>
            <div className="fp-marketing-tagline">Drive smarter. Earn more.</div>
          </div>
        </Link>
        <div>
          <a href="#features">Features</a>
          <Link href="/pricing">Pricing</Link>
          <a href="#about">About</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/data-deletion">Data Deletion</Link>
          <Link href="/login">Sign In</Link>
        </div>
        <span>© 2026 FleetPilot</span>
      </footer>
    </main>
  );
}

function PreviewMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`fp-preview-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AboutPoint({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <article>
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="fp-marketing-faq-item">
      <summary>{q}<span>+</span></summary>
      <p>{a}</p>
    </details>
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

function MarketingIcon({ type }: { type: string }) {
  const p = {
    viewBox: "0 0 24 24",
    className: "h-[18px] w-[18px] fill-none stroke-current",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "truck") return <svg {...p}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>;
  if (type === "expense") return <svg {...p}><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
  if (type === "tool") return <svg {...p}><path d="M14.5 6a4 4 0 0 0-5 5L4 16.5 7.5 20l5.5-5.5a4 4 0 0 0 5-5L15.5 12 12 8.5 14.5 6Z"/></svg>;
  if (type === "settlement") return <svg {...p}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 9h8M8 13h5"/></svg>;
  if (type === "fuel") return <svg {...p}><path d="M6 3h9v18H6zM8 7h5"/><path d="M15 8h2l2 3v6a2 2 0 0 0 2 2"/></svg>;
  if (type === "ai") return <svg {...p}><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/></svg>;
  if (type === "document") return <svg {...p}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/></svg>;
  return <svg {...p}><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>;
}
