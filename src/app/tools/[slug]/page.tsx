import type { Metadata } from "next";
import Link from "next/link";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import PublicLayout from "@/components/public-layout";
import FreeTools from "../free-tools";
import {
  TOOL_DEFINITIONS,
  toolDefinitionFromSlug,
} from "@/lib/free-tools";
import { publicPageMetadata } from "@/lib/seo";
import {
  ToolsAnnouncement,
  ToolsFooter,
  ToolsHeader,
} from "../tools-chrome";
import styles from "../tools-redesign.module.css";

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

type ToolRouteProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return TOOL_DEFINITIONS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: ToolRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = toolDefinitionFromSlug(slug);

  if (!tool) {
    return publicPageMetadata({
      title: "Free Trucking Calculator",
      description:
        "Use MileVoxa free trucking calculators for cost, profit, fuel, and rate-per-mile decisions.",
      path: `/tools/${slug}`,
      noIndex: true,
    });
  }

  return publicPageMetadata({
    title: tool.metaTitle,
    description: tool.metaDescription,
    path: `/tools/${tool.slug}`,
  });
}

export default async function ToolCalculatorPage({
  params,
}: ToolRouteProps) {
  const { slug } = await params;
  const tool = toolDefinitionFromSlug(slug);

  if (!tool) notFound();

  return (
    <PublicLayout
      chrome="none"
      mainClassName={`${styles.page} ${jakarta.variable} ${mono.variable} mv-tools-page mv-tools-redesign fp-marketing min-h-screen`}
    >
      <ToolsAnnouncement />
      <ToolsHeader />

      <section className={`${styles.hero} ${styles.routeHero}`}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.container}>
          <div className={styles.heroBadge}>
            <span />
            FREE TRUCKING CALCULATOR
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
            {TOOL_DEFINITIONS.map((item) => (
              <Link
                key={item.key}
                href={`/tools/${item.slug}`}
                aria-current={item.key === tool.key ? "page" : undefined}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="interactive-suite" className={styles.toolsSection}>
        <div className={styles.toolsContainer}>
          <FreeTools initialActive={tool.key} navigationMode="routes" />
        </div>
      </section>

      <section className={styles.bridge}>
        <div className={styles.bridgeCard}>
          <span>ALL FREE CALCULATORS</span>
          <h2>Run another number before you make the decision.</h2>
          <p>
            Switch calculators above or return to the full MileVoxa tools
            overview.
          </p>
          <div className={styles.bridgeActions}>
            <Link className={styles.primaryAction} href="/tools">
              View All Free Tools →
            </Link>
            <Link className={styles.secondaryAction} href="/signup">
              Join the Free Beta
            </Link>
          </div>
        </div>
      </section>

      <ToolsFooter />
    </PublicLayout>
  );
}
