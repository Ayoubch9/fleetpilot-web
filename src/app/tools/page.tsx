import type { Metadata } from "next";
import Link from "next/link";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import PublicLayout from "@/components/public-layout";
import FreeTools from "./free-tools";
import { TOOL_DEFINITIONS } from "@/lib/free-tools";
import { publicPageMetadata } from "@/lib/seo";
import {
  ToolsAnnouncement,
  ToolsFooter,
  ToolsHeader,
} from "./tools-chrome";
import styles from "./tools-redesign.module.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--mv-tools-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--mv-tools-mono",
  display: "swap",
});

export const metadata: Metadata = publicPageMetadata({
  title: "Free Trucking Calculators",
  description:
    "Free trucking calculators for cost per mile, load profit, owner-operator profit, lease-operator take-home, fuel cost and rate per mile.",
  path: "/tools",
});

export default function ToolsPage() {
  return (
    <PublicLayout
      chrome="none"
      mainClassName={`${styles.page} ${jakarta.variable} ${mono.variable} mv-tools-page mv-tools-redesign fp-marketing min-h-screen`}
    >
      <ToolsAnnouncement />
      <ToolsHeader />

      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.container}>
          <div className={styles.heroBadge}>
            <span />
            Built for Independent Drivers &amp; 1–10 Truck Fleets
          </div>

          <h1>
            Real Trucking Math.
            <span>Zero Spreadsheets Required.</span>
          </h1>

          <p>
            Free, practical calculators for the numbers owner-operators and
            small fleets check every week. No login, no credit card and no
            spreadsheet required.
          </p>

          <div className={styles.quickNav} aria-label="Free calculator shortcuts">
            {TOOL_DEFINITIONS.map((tool) => (
              <Link key={tool.key} href={`/tools/${tool.slug}`}>
                {tool.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="interactive-suite" className={styles.toolsSection}>
        <div className={styles.toolsContainer}>
          <div className={styles.sectionHeading}>
            <span>FREE TOOLS FOR TRUCKERS</span>
            <h2>Know the number before you make the decision.</h2>
            <p>
              Use the same MileVoxa calculators you already have. The formulas,
              fields, routes and calculation rules stay exactly the same—the
              presentation is simply easier to scan and use.
            </p>
          </div>

          <FreeTools />
        </div>
      </section>

      <section className={styles.bridge}>
        <div className={styles.bridgeCard}>
          <span>FROM CALCULATOR TO CONTROL CENTER</span>
          <h2>Stop re-entering the same numbers every week.</h2>
          <p>
            MileVoxa stores the loads, trucks, fuel, maintenance and expenses
            behind these calculations so profitability stays available whenever
            you need it.
          </p>
          <div className={styles.bridgeActions}>
            <Link className={styles.primaryAction} href="/signup">
              Join the Free Beta →
            </Link>
            <Link className={styles.secondaryAction} href="/#features">
              See Platform Features
            </Link>
          </div>
          <small>Free during public beta · No credit card required</small>
        </div>
      </section>

      <ToolsFooter />
    </PublicLayout>
  );
}
