import type { Metadata } from "next";
import Link from "next/link";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import PublicLayout from "@/components/public-layout";
import { publicPageMetadata } from "@/lib/seo";
import {
  ToolsAnnouncement,
  ToolsFooter,
  ToolsHeader,
} from "../tools/tools-chrome";
import styles from "./pricing-redesign.module.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--mv-pricing-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--mv-pricing-mono",
  display: "swap",
});

export const metadata: Metadata = publicPageMetadata({
  title: "Pricing & Public Beta | MileVoxa",
  description:
    "MileVoxa is currently 100% free during Public Beta. No credit card required. Straightforward pricing built for owner-operators and 1–10 truck fleets.",
  path: "/pricing",
});

const includedFeatures = [
  {
    title: "Load Decision Center:",
    text: "Break-even & profit scoring before booking",
  },
  {
    title: "Weekly Settlement Control:",
    text: "True operating result after costs",
  },
  {
    title: "Fuel & Expense Tracking:",
    text: "Cost-per-mile and diesel averages",
  },
  {
    title: "Fleet & Maintenance Logs:",
    text: "Preventative service thresholds",
  },
  {
    title: "Pilot AI Copilot:",
    text: "Query your fleet numbers in natural language",
  },
  {
    title: "Action Center:",
    text: "Live compliance, expiration & settlement alerts",
  },
  {
    title: "Web + Mobile Account:",
    text: "Full data sync from cab to home desk",
  },
  {
    title: "Direct Developer Line:",
    text: "Priority support & feedback pipeline",
  },
] as const;

const philosophy = [
  {
    title: "Simple Per-Truck Model",
    text: "Future pricing will be priced simply per truck with no setup fees or forced onboarding calls.",
  },
  {
    title: "30+ Days Advance Notice",
    text: "Every beta member will receive clear written notice before any paid plans are introduced.",
  },
  {
    title: "Lifetime Founder Perks",
    text: "Early feedback contributors who help shape MileVoxa will receive permanent preferred terms.",
  },
] as const;

const comparisonRows = [
  [
    "Spot Load Profit Check Before Booking",
    "Manual math in cab",
    "Complex setup",
    "✓ Instant Load Decision Center",
  ],
  [
    "Deadhead & All-Mile RPM Analysis",
    "Often overlooked",
    "Basic reporting",
    "✓ Automated with margin flags",
  ],
  [
    "Settlement Reconciliations & Deductions",
    "Shoebox of receipts",
    "Enterprise accounting add-on",
    "✓ Integrated weekly control",
  ],
  [
    "Pilot AI Operations Assistant",
    "—",
    "—",
    "✓ Included across web & mobile",
  ],
  [
    "Action Center (Due Dates & Reminders)",
    "Mental memory / Phone alarms",
    "Email alerts",
    "✓ Unified operational dashboard",
  ],
  [
    "Upfront Credit Card Requirement",
    "—",
    "Credit card or annual invoice",
    "✓ None (100% Free in Beta)",
  ],
] as const;

const pricingFaqs = [
  {
    question: "Is MileVoxa really free?",
    answer:
      "Yes. MileVoxa is completely free during the Public Beta. No credit card is required to sign up or use any of the features. Paid plans will be introduced later, and users will receive clear advance notice before free beta access materially changes.",
  },
  {
    question: "Will I be automatically charged when the beta ends?",
    answer:
      "No. Because we never ask for credit card or payment information during the beta sign-up, you cannot be billed automatically. If you decide to upgrade to a paid plan later, you will choose to do so explicitly.",
  },
  {
    question: "Can I track multiple trucks under one account?",
    answer:
      "Yes. MileVoxa is engineered specifically for owner-operators and small fleets managing 1 to 10 power units, allowing you to segment expenses, maintenance, and revenue per truck.",
  },
  {
    question: "Does MileVoxa replace my accountant or tax preparer?",
    answer:
      "No. MileVoxa organizes your operational data, loads, and weekly operating metrics so you know your numbers in real time, but it is not a substitute for certified accounting, tax, or legal counsel.",
  },
] as const;

export default function PricingPage() {
  return (
    <PublicLayout
      chrome="none"
      mainClassName={`${styles.page} ${jakarta.variable} ${mono.variable} mv-pricing-page`}
    >
      <ToolsAnnouncement />
      <ToolsHeader />

      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroBadge}>
            <span />
            Zero Cost During Beta
          </div>

          <h1>
            Transparent Pricing.
            <span>No Enterprise Lock-In.</span>
          </h1>

          <p>
            MileVoxa is currently in open Public Beta. We believe truckers should
            see the real value of their numbers before paying a dime.
          </p>

          <div className={styles.trustSignals}>
            <span><b>✓</b> No credit card required</span>
            <span><b>✓</b> Web + Mobile included</span>
            <span><b>✓</b> Advance notice before paid tiers</span>
          </div>
        </div>
      </section>

      <section className={styles.pricingSection}>
        <div className={styles.pricingContainer}>
          <div className={styles.tierGrid}>
            <article className={styles.betaCard}>
              <div className={styles.activeBadge}>
                Active Now — Free Public Beta
              </div>

              <div>
                <div className={styles.planHeading}>
                  <div>
                    <h2>Full Platform Access</h2>
                    <p>
                      For single-truck owner-operators and small fleets up to 10
                      power units.
                    </p>
                  </div>
                  <div className={styles.price}>
                    <strong>$0</strong>
                    <span>/ month</span>
                  </div>
                </div>

                <p className={styles.planIntro}>
                  During beta, you get unrestricted access to every operational
                  tool so you can test your numbers on actual freight:
                </p>

                <div className={styles.featureColumns}>
                  <ul>
                    {includedFeatures.slice(0, 4).map((feature) => (
                      <li key={feature.title}>
                        <span>✓</span>
                        <p><strong>{feature.title}</strong> {feature.text}</p>
                      </li>
                    ))}
                  </ul>
                  <ul>
                    {includedFeatures.slice(4).map((feature) => (
                      <li key={feature.title}>
                        <span>✓</span>
                        <p><strong>{feature.title}</strong> {feature.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={styles.betaCardBottom}>
                <div>
                  <span>No commitments • No card details entered</span>
                  <small>
                    You will never be auto-charged when the beta phase concludes.
                  </small>
                </div>
                <Link href="/signup">Join the Free Beta →</Link>
              </div>
            </article>

            <aside className={styles.philosophyCard}>
              <div>
                <span className={styles.kicker}>Our Pricing Philosophy</span>
                <h3>What happens when beta ends?</h3>
                <p className={styles.philosophyIntro}>
                  We despise enterprise freight software that forces you into
                  sales calls, 12-month lock-in contracts, and multi-thousand
                  dollar onboarding fees.
                </p>

                <div className={styles.philosophyList}>
                  {philosophy.map((item) => (
                    <div key={item.title}>
                      <strong>{item.title}</strong>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.zeroRisk}>
                Zero risk to try your fleet today
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.compareSection}>
        <div className={styles.compareContainer}>
          <div className={styles.centerHeading}>
            <span>Side-by-Side</span>
            <h2>Compare How You Manage The Truck</h2>
            <p>
              See why manual notes and disconnected apps cost you more than
              software ever could.
            </p>
          </div>

          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Spreadsheets &amp; Paper Notes</th>
                  <th>Legacy TMS ($150+/mo)</th>
                  <th>MileVoxa (Free Beta)</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    <td className={row[1] === "—" ? styles.mutedCell : styles.negativeCell}>{row[1]}</td>
                    <td className={row[2] === "—" || row[2] === "Complex setup" || row[2] === "Basic reporting" || row[2] === "Email alerts" ? styles.mutedCell : styles.negativeCell}>{row[2]}</td>
                    <td>{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="faq" className={styles.faqSection}>
        <div className={styles.faqContainer}>
          <div className={styles.centerHeading}>
            <span>Common Questions</span>
            <h2>Pricing &amp; Beta FAQ</h2>
            <p>Everything you need to know about our free public beta phase.</p>
          </div>

          <div className={styles.faqList}>
            {pricingFaqs.map((item) => (
              <article key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <h2>Start Organizing Your Trucking Numbers Today</h2>
          <p>
            Stop guessing what the truck made at the end of the week. Connect
            loads, fuel, and expenses in one clean operating system.
          </p>
          <div>
            <Link href="/signup" className={styles.primaryAction}>
              Join the Free Beta
            </Link>
            <Link href="/tools" className={styles.secondaryAction}>
              Test Free Calculators First
            </Link>
          </div>
          <small>
            Free during beta • No credit card required • Instant access
          </small>
        </div>
      </section>

      <ToolsFooter />
    </PublicLayout>
  );
}
