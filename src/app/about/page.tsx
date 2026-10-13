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
import styles from "./about-redesign.module.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--mv-about-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--mv-about-mono",
  display: "swap",
});

export const metadata: Metadata = publicPageMetadata({
  title: "About MileVoxa | Built for the Business Behind the Truck",
  description:
    "Why we built MileVoxa: giving owner-operators and 1–10 truck fleets total financial visibility into real operating profits, not just gross revenue.",
  path: "/about",
});

const principles = [
  {
    number: "01",
    title: "Clarity Over Feature Bloat",
    text:
      "We do not add complex menus or enterprise enterprise baggage just to look big. If a feature does not help you save time, make better load decisions, or keep more profit, we do not build it.",
    note: "Fast, clean, intuitive",
  },
  {
    number: "02",
    title: "Zero Fake Data or Hype",
    text:
      "We do not invent customer testimonials, pretend to have fictitious AI superpowers, or make exaggerated revenue claims. We present cold, hard trucking math and honest operational tools.",
    note: "Built on transparent math",
  },
  {
    number: "03",
    title: "Cab to Desk Synchronization",
    text:
      "Trucking happens on the highway, at truck stops, and in office yards. MileVoxa works identically whether you are verifying a rate on your phone in the cab or analyzing weekly trends on a desktop monitor.",
    note: "Connected web & mobile",
  },
] as const;

export default function AboutPage() {
  return (
    <PublicLayout
      chrome="none"
      mainClassName={`${styles.page} ${jakarta.variable} ${mono.variable} mv-about-page`}
    >
      <ToolsAnnouncement />
      <ToolsHeader />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <span />
            Built for Independent Truckers &amp; Small Fleets
          </div>

          <h1>
            We Built MileVoxa Because
            <span>Gross Revenue Is a Trap.</span>
          </h1>

          <p>
            The commercial freight industry tells drivers that booking an $8,000
            week is winning. But after unrecorded deadhead, fuel card interest,
            broker deductions, and deferred maintenance, too many independent
            operators have no idea where their paycheck went.
          </p>

          <div className={styles.heroChecks}>
            <span><b>✓</b> No corporate fluff</span>
            <span><b>✓</b> No complex enterprise lock-in</span>
            <span><b>✓</b> Focused purely on net profit per mile</span>
          </div>
        </div>
      </section>

      <section className={styles.realitySection}>
        <div className={styles.realityGrid}>
          <div className={styles.realityCopy}>
            <span>The Operational Reality</span>
            <h2>
              Driving the truck is only half the job. Running the business is
              the other.
            </h2>
            <p>
              Most software tools are built by Silicon Valley tech teams who
              have never sat in a sleeper berth or watched diesel pump meters
              run past $600. They build multi-thousand-dollar TMS platforms made
              for 500-truck megacarriers, leaving the 1–10 truck operator
              stranded with messy spreadsheets, phone notes, and shoeboxes of
              thermal receipts.
            </p>
            <p>
              MileVoxa was started with one conviction:{" "}
              <strong>
                owner-operators deserve software that speaks their language
              </strong>
              —load rates, loaded vs. empty miles, true cost-per-mile, and weekly
              settlement net take-home.
            </p>
          </div>

          <div className={styles.problemCard}>
            <div className={styles.fragmented}>
              <span>The Fragmented Mess</span>
              <p>
                Dispatch details in text messages. Fuel purchases in one portal.
                Mileage logged on notepads. Settlements arriving days later as
                confusing PDFs with hidden deductions.
              </p>
            </div>

            <div className={styles.fix}>
              <span>The MileVoxa Fix</span>
              <p>
                Every dollar and mile connected in one operating system. When
                you look at your screen on Friday, you see what the truck
                actually banked.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.principlesSection}>
        <div className={styles.principlesContainer}>
          <div className={styles.centerHeading}>
            <span>Our Standards</span>
            <h2>How We Build For Real Carriers</h2>
            <p>
              Every feature we write must pass three simple rules before it goes
              live.
            </p>
          </div>

          <div className={styles.principlesGrid}>
            {principles.map((principle) => (
              <article key={principle.number}>
                <div>
                  <div className={styles.principleNumber}>{principle.number}</div>
                  <h3>{principle.title}</h3>
                  <p>{principle.text}</p>
                </div>
                <div className={styles.principleNote}>{principle.note}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.betaSection}>
        <div className={styles.betaCard}>
          <div className={styles.betaPill}>Open Public Beta</div>
          <h2>We&apos;re Building This Together With You</h2>
          <p>
            MileVoxa is currently in active Public Beta. That means our software
            is 100% free for independent drivers and small carriers. There are no
            credit card forms, no automated trial expirations that charge you
            quietly, and no high-pressure sales calls.
          </p>
          <p>
            In return, all we ask is your honest feedback: tell us what
            calculations help you most, what reports you need, and what we can
            do to make running your truck easier.
          </p>

          <div className={styles.betaCardBottom}>
            <span>Direct access to developer updates &amp; feedback pipeline</span>
            <Link href="/signup">Join the Free Beta →</Link>
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <h2>Ready to See What Your Truck Actually Made?</h2>
          <p>
            Built for owner-operators and small fleets that want a tighter,
            more financially intelligent trucking business.
          </p>
          <div className={styles.finalActions}>
            <Link href="/signup" className={styles.primaryAction}>
              Join the Free Beta
            </Link>
            <Link href="/tools" className={styles.secondaryAction}>
              Explore Free Calculators
            </Link>
          </div>
          <small>
            Free during public beta • No credit card required • Instant access
          </small>
        </div>
      </section>

      <ToolsFooter />
    </PublicLayout>
  );
}
