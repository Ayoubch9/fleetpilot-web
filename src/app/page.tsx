import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import PublicLayout from "@/components/public-layout";
import HomepageStickyCta from "@/components/homepage-sticky-cta";
import { publicPageMetadata, SITE_URL } from "@/lib/seo";
import { SUPPORT_EMAIL } from "@/lib/support";
import styles from "./home-redesign.module.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--mv-home-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--mv-home-mono",
  display: "swap",
});

export const metadata: Metadata = publicPageMetadata({
  title: "MileVoxa | Free Public Beta for Trucking Operations",
  description:
    "Manage loads, expenses, trucks, fuel, maintenance, documents and weekly settlements in one place. Join the free MileVoxa public beta with no credit card required.",
  path: "/",
});

const problemCards = [
  ["01", "LOADS", "What did this load really make after deadhead and fuel?", "Rate vs. Actual net"],
  ["02", "EXPENSES", "Where did the money go this week?", "Cash leaks & fuel drafts"],
  ["03", "MAINTENANCE", "What service is coming due on the tractor?", "Tires, PM & reserves"],
  ["04", "SETTLEMENT", "What is left after expenses, fees and weekly costs?", "True take-home income"],
  ["05", "DOCUMENTS", "What expires next? Where is that BOL?", "COI, med cards & IFTA"],
];

const workflowSteps = [
  {
    number: "STEP 01",
    title: "Add the Load",
    body: "Track the agreed rate, pickup and delivery, loaded miles, deadhead miles and assigned truck.",
    note: "Common dispatcher load information can also be used to prefill a new load.",
  },
  {
    number: "STEP 02",
    title: "Record What the Truck Spends",
    body: "Log fuel, tolls, repairs, scales, reimbursements and the operating costs that affect the week.",
    note: "Keep costs connected to the truck and the operating period they belong to.",
  },
  {
    number: "STEP 03",
    title: "MileVoxa Connects the Numbers",
    body: "Load revenue, fuel, operating expenses, weekly fixed costs and company fees come together in one operating view.",
    note: "The same underlying records feed the views you use across MileVoxa.",
  },
  {
    number: "STEP 04",
    title: "See What the Truck Made",
    body: "Review revenue, total costs, profit, all-mile RPM and the weekly result without rebuilding the math in a spreadsheet.",
    note: "Use the result as an operating view, then verify important business decisions with your own records.",
  },
];

const connectedFeatures = [
  ["🚛", "LOADS", "Track every load, rate and mile."],
  ["⚖️", "LOAD DECISION", "Estimate whether a load is worth taking."],
  ["💳", "EXPENSES", "Know where operating money goes."],
  ["⛽", "FUEL ANALYTICS", "Track gallons, cost, MPG and average fuel price."],
  ["🚚", "TRUCKS", "Keep the fleet organized by unit."],
  ["🔧", "MAINTENANCE", "Track services and upcoming maintenance."],
  ["📑", "WEEKLY SETTLEMENT", "Bring weekly revenue and costs together."],
  ["💵", "REIMBURSEMENTS", "Track money owed back to the business."],
  ["📁", "DOCUMENTS", "Organize important trucking documents."],
  ["🚨", "ACTION CENTER", "See what needs attention next."],
  ["📈", "REPORTS", "Review and export operating performance."],
  ["💡", "PILOT AI", "Ask questions about your MileVoxa data."],
];

const targetUsers = [
  ["🚛", "OWNER-OPERATORS", "For independent operators who need clear visibility into loads, costs and operating results without building a spreadsheet system from scratch."],
  ["🚚", "SMALL FLEETS", "For businesses managing multiple trucks that want loads, fuel, maintenance and weekly numbers organized under one company account."],
  ["📈", "GROWING TRUCKING BUSINESSES", "For operators replacing disconnected spreadsheets, message threads and paper records with one connected operating system."],
];

const homepageFaqs = [
  {
    question: "Is MileVoxa really free?",
    answer:
      "MileVoxa is currently free during the Public Beta. No credit card is required. Paid plans may be introduced later, and users will receive advance notice before free beta access materially changes.",
  },
  {
    question: "Is MileVoxa for company drivers?",
    answer:
      "MileVoxa is mainly designed for owner-operators and small trucking businesses that manage their own loads, trucks, expenses and operating numbers.",
  },
  {
    question: "Can I use MileVoxa with multiple trucks?",
    answer:
      "Yes. MileVoxa is designed to organize trucking-business data across multiple trucks under the same company account.",
  },
  {
    question: "Does MileVoxa replace my accountant?",
    answer:
      "No. MileVoxa helps organize and understand operating information but is not a substitute for professional accounting, tax, legal or financial advice.",
  },
  {
    question: "Can I use the same account on web and mobile?",
    answer:
      "Yes. Web and mobile use the same MileVoxa account and company data so the operation stays connected across both experiences.",
  },
  {
    question: "Do I need a credit card?",
    answer: "No credit card is required to join the free Public Beta.",
  },
  {
    question: "What happens after beta?",
    answer:
      "Paid plans may be announced later. MileVoxa will provide advance notice before beta access materially changes, and free beta access will not automatically become a paid subscription. Choosing a future paid plan will require explicit action.",
  },
];

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MileVoxa",
  url: SITE_URL,
  logo: `${SITE_URL}/branding/milevoxa-logo-full.png`,
  email: SUPPORT_EMAIL,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: SUPPORT_EMAIL,
    availableLanguage: ["English"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MileVoxa",
  url: SITE_URL,
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: homepageFaqs.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function HomePage() {
  return (
    <PublicLayout
      chrome="none"
      mainClassName={`${styles.page} ${jakarta.variable} ${mono.variable}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className={styles.betaStrip}>
        <div className={styles.containerRow}>
          <span className={styles.betaBadge}>PUBLIC BETA</span>
          <span>MileVoxa is free during our open public beta.</span>
          <span className={styles.betaDot}>•</span>
          <span className={styles.hideMobile}>No credit card required.</span>
          <Link href="/load-decision" className={styles.inlineGreenLink}>
            Run the Load Calculator ↗
          </Link>
        </div>
      </div>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="MileVoxa home">
            <Image unoptimized width={2499} height={556}
              src="/branding/milevoxa-logo-full-dark.png"
              alt="MileVoxa — Run your trucking business with clarity."
              className={styles.headerLogo}
            />
          </Link>

          <nav className={styles.nav} aria-label="Homepage navigation">
            <a href="#how-it-works">How It Works</a>
            <a href="#pilot-ai">Pilot AI</a>
            <a href="#action-center">Action Center</a>
            <Link href="/tools" className={styles.navMuted}>
              Free Tools ↗
            </Link>
          </nav>

          <div className={styles.headerActions}>
            <Link href="/login" className={styles.signInLink}>
              Sign In
            </Link>
            <Link href="/signup" className={styles.primaryButtonSmall}>
              Join the Free Beta
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.driverHero}>
        <div className={styles.driverHeroGridBackground} aria-hidden="true" />
        <div className={styles.driverHeroGlow} aria-hidden="true" />

        <div className={styles.container}>
          <div className={styles.driverHeroPill}>
            <span />
            BUILT FOR INDEPENDENT DRIVERS &amp; 1–10 TRUCK FLEETS
          </div>

          <div className={styles.driverHeroLayout}>
            <div className={styles.driverHeroCopy}>
              <h1>
                Your truck can gross $8,000 this week.
                <span>That doesn&apos;t mean you made $8,000.</span>
              </h1>

              <p className={styles.driverHeroLead}>
                Fuel stops, unlogged deadhead miles, shop fees, and confusing
                deductions make it tough to know what the truck actually banked.
              </p>

              <p className={styles.driverHeroAside}>
                MileVoxa brings your rate cons, fuel cards, and miles into one
                clean view so you see real take-home profit before the week closes.
              </p>

              <div className={styles.driverHeroActions}>
                <Link href="/signup" className={styles.driverHeroPrimary}>
                  Join the Free Beta
                  <span aria-hidden="true">→</span>
                </Link>

                <a href="#how-it-works" className={styles.driverHeroSecondary}>
                  See How It Works ↓
                </a>
              </div>

              <div className={styles.driverHeroTrust}>
                <span>✓</span>
                <p>Free public beta • No credit card required • Built for the cab</p>
              </div>
            </div>

            <div
              className={styles.driverTripCard}
              aria-label="Illustrative MileVoxa trip profit card"
            >
              <div className={styles.tripHeader}>
                <div className={styles.tripIdentity}>
                  <div className={styles.tripIcon} aria-hidden="true">
                    🚛
                  </div>

                  <div>
                    <div className={styles.tripRouteRow}>
                      <strong>Gary, IN ➔ Dallas, TX</strong>
                      <span>UNIT #01</span>
                    </div>
                    <small>Rate Con #4412 • 53ft Dry Van</small>
                  </div>
                </div>

                <div className={styles.tripGross}>
                  <small>GROSS AGREED</small>
                  <strong>$2,450.00</strong>
                </div>
              </div>

              <div className={styles.tripCostGrid}>
                <article className={styles.tripCostCard}>
                  <div>
                    <span className={styles.tripCostAmber}>⛽ Pilot / Flying J</span>
                    <strong>-$458.61</strong>
                    <small>118 Gal @ $3.88/gal</small>
                  </div>
                  <footer>Fuel Card Draft #4810</footer>
                </article>

                <article className={styles.tripCostCard}>
                  <div>
                    <span>🛣️ Odometer Miles</span>
                    <strong>915 Total</strong>
                    <small className={styles.tripDeadhead}>+95 mi empty deadhead</small>
                  </div>
                  <footer>820 loaded + 95 empty</footer>
                </article>

                <article className={styles.tripCostCard}>
                  <div>
                    <span>🔧 Fixed &amp; Shop</span>
                    <strong>-$238.20</strong>
                    <small>Tire reserve + factoring</small>
                  </div>
                  <footer className={styles.tripReclaimed}>✓ $184 lumper reclaimed</footer>
                </article>
              </div>

              <div className={styles.tripResult}>
                <div className={styles.tripResultPrimary}>
                  <small>WHAT THE TRUCK ACTUALLY MADE:</small>
                  <div>
                    <strong>+$1,753.19</strong>
                    <span>Take-home profit</span>
                  </div>
                </div>

                <div className={styles.tripRates}>
                  <div>
                    <small>Gross Rate</small>
                    <strong>$2.99 / mi</strong>
                  </div>
                  <div>
                    <small>All-Mile RPM</small>
                    <strong className={styles.tripRateGreen}>$2.68 / mi</strong>
                  </div>
                  <div>
                    <small>Net Margin</small>
                    <strong>71.5%</strong>
                  </div>
                </div>
              </div>

              <p className={styles.tripFootnote}>
                No spreadsheets. No guesswork. See your real profit per load before
                you reload.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionDeep}>
        <div className={styles.container}>
          <SectionHeading
            eyebrow="THE DAY-TO-DAY REALITY"
            title="Running the truck is only half the job."
            text="The other half is running the business behind it."
          />
          <div className={styles.problemGrid}>
            {problemCards.map(([number, title, body, note]) => (
              <article key={number} className={styles.problemCard}>
                <div>
                  <span className={styles.numberBadge}>{number}</span>
                  <h3>{title}</h3>
                  <p>“{body}”</p>
                </div>
                <small>{note}</small>
              </article>
            ))}
          </div>
          <div className={styles.centerNote}>
            These answers usually live in five different places. <strong>MileVoxa puts them together.</strong>
          </div>
        </div>
      </section>

      <section className={styles.sectionNavy}>
        <div className={styles.container}>
          <div className={styles.centerHeading}>
            <span>WORKFLOW CLARITY</span>
            <h2>From Fragmented Tools to One Operating System</h2>
          </div>

          <div className={styles.beforeAfterGrid}>
            <article className={`${styles.beforeAfterCard} ${styles.beforeCard}`}>
              <div className={styles.beforeAfterTitle}><i className={styles.redDot} /> WITHOUT MILEVOXA</div>
              <div className={styles.listStack}>
                {[
                  ["💬 Dispatch messages in WhatsApp & SMS", "Scattered"],
                  ["📝 Phone notes app for odometer & miles", "Unconnected"],
                  ["⛽ Door-pocket envelope of paper fuel receipts", "Manual Entry"],
                  ["📊 Outdated Excel spreadsheet for accounting", "Delayed"],
                  ["📄 Unopened settlement PDFs in email", "Unreviewed"],
                  ["📱 4 different phone apps to piece it together", "Time Consuming"],
                ].map(([item, status]) => (
                  <div key={item}><span>{item}</span><b>{status}</b></div>
                ))}
              </div>
            </article>

            <article className={`${styles.beforeAfterCard} ${styles.afterCard}`}>
              <div className={styles.beforeAfterTitle}><i className={styles.greenDot} /> WITH MILEVOXA</div>
              <p className={styles.cardIntro}>One connected MileVoxa system containing:</p>
              <div className={styles.connectedMiniGrid}>
                {["Loads & Rates", "Expenses & Tolls", "Fuel Analytics", "Trucks & Specs", "Maintenance Logs", "Compliance Vault", "Settlements", "Action Alerts"].map((item) => (
                  <div key={item}><span>✓</span>{item}</div>
                ))}
              </div>
              <div className={styles.afterStatement}>One business. One set of numbers. <strong>One place to understand it.</strong></div>
            </article>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={styles.sectionDeep}>
        <div className={styles.container}>
          <SectionHeading
            eyebrow="SIMPLE 4-STEP PROCESS"
            title="From load booked to weekly profit."
            text="How MileVoxa turns everyday operating records into a clearer business view."
          />
          <div className={styles.workflowGrid}>
            {workflowSteps.map((step) => (
              <article key={step.number} className={styles.workflowCard}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                <small>{step.note}</small>
              </article>
            ))}
          </div>
          <div className={styles.sectionCta}>
            <Link href="/signup" className={styles.primaryButton}>
              See your own numbers in MileVoxa →
            </Link>
          </div>
        </div>
      </section>

      <section id="action-center" className={styles.sectionNavy}>
        <div className={styles.container}>
          <div className={styles.splitSection}>
            <div>
              <span className={styles.eyebrow}>OPERATIONAL AWARENESS</span>
              <h2>Know what needs your attention today.</h2>
              <p>Instead of checking every part of the business manually, MileVoxa surfaces important operational items in one Action Center.</p>
              <Link href="/signup" className={styles.inlineGreenLink}>Explore Action Center in Free Beta →</Link>
            </div>
            <div className={styles.alertStack}>
              <AlertCard icon="🔧" title="Maintenance Due Soon" body="Truck 02 — oil service approaching mileage threshold" meta="Odometer: 498,420 mi · target: 500,000 mi" status="1,580 mi left" tone="amber" />
              <AlertCard icon="📄" title="Document Expiring" body="Insurance certificate — commercial auto liability" meta="Renewal required before expiration" status="12 days remaining" tone="red" />
              <AlertCard icon="⚖️" title="Settlement Review" body="Weekly costs need attention" meta="Confirm deductions before closing the week" status="Review Needed" tone="neutral" />
              <AlertCard icon="💵" title="Reimbursement Pending" body="Paid out-of-pocket on a completed load" meta="Carrier reimbursement still open" status="$184.52" tone="green" />
            </div>
          </div>
        </div>
      </section>

      <section id="pilot-ai" className={styles.sectionDeep}>
        <div className={styles.container}>
          <SectionHeading
            eyebrow="FLEET INTELLIGENCE"
            title="Ask questions about your own trucking operation."
            text="Pilot AI works with the operational information available in your MileVoxa account to help you understand your business faster."
          />
          <div className={styles.aiGrid}>
            <AiExample question="How much did Truck 2 spend on fuel this month?" answer="Review recorded fuel purchases, gallons, average price and the truck's available fuel history." />
            <AiExample question="Which week had the highest profit?" answer="Compare the operating results MileVoxa can derive from the weeks available in your account." />
            <AiExample question="What are my biggest expense categories?" answer="Use your recorded expenses to identify the categories that are taking the largest share of operating spend." />
            <AiExample question="Show me my recent load performance." answer="Review recent load rates, miles, deadhead and profit-related operating information from the data already in MileVoxa." />
          </div>
          <p className={styles.aiDisclaimer}>*Pilot AI analyzes data available in your MileVoxa account. It does not provide certified legal, tax, accounting or financial advice.</p>
        </div>
      </section>

      <section id="features" className={styles.sectionNavy}>
        <div className={styles.container}>
          <div className={styles.centerHeading}>
            <span>COMPLETE SUITE</span>
            <h2>Everything Connected</h2>
            <p>Designed around the weekly workflow of an owner-operator or small fleet.</p>
          </div>
          <div className={styles.featureGrid}>
            {connectedFeatures.map(([icon, title, text]) => (
              <article key={title} className={styles.featureCard}>
                <span>{icon}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className={styles.sectionDeep}>
        <div className={styles.container}>
          <div className={styles.centerHeading}>
            <span>TARGET AUDIENCE</span>
            <h2>Built for people running the business behind the truck.</h2>
            <p>MileVoxa is built for practical trucking operations that need clarity without enterprise-software complexity.</p>
          </div>
          <div className={styles.targetGrid}>
            {targetUsers.map(([icon, title, text]) => (
              <article key={title} className={styles.targetCard}>
                <span>{icon}</span><h3>{title}</h3><p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionNavy}>
        <div className={`${styles.container} ${styles.betaCenter}`}>
          <span className={styles.betaBadgeLarge}>PUBLIC BETA ACCESS</span>
          <h2>Help Shape MileVoxa.</h2>
          <p>MileVoxa is currently in free public beta. We&apos;re inviting owner-operators and small fleets to use the platform, tell us what works, tell us what doesn&apos;t and help us build a better trucking-business tool.</p>
          <div className={styles.betaChecklist}>
            {["Free during public beta", "No credit card required to sign up", "Web + mobile connected account", "Send feedback directly to the MileVoxa team", "Paid plans will be announced later", "Advance notice before free beta access materially changes"].map((item) => (
              <div key={item}><span>✓</span>{item}</div>
            ))}
          </div>
          <div className={styles.betaActions}>
            <Link href="/signup" className={styles.primaryButton}>Join the Free Beta</Link>
            <Link href="/pricing" className={styles.secondaryButton}>Beta Access Details</Link>
          </div>
          <small className={styles.betaLegal}>Free beta access will not automatically become a paid subscription. A future paid plan will require your explicit action.</small>
        </div>
      </section>

      <section className={styles.sectionDeep}>
        <div className={`${styles.container} ${styles.faqWrap}`}>
          <div className={styles.centerHeading}>
            <span>COMMON QUESTIONS</span>
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className={styles.faqList}>
            {homepageFaqs.map((item) => (
              <details key={item.question} className={styles.faqItem}>
                <summary>{item.question}<span>+</span></summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.finalCta} ${styles.gridBackground}`}>
        <div className={styles.finalGlow} aria-hidden="true" />
        <div className={styles.container}>
          <h2>Stop wondering what the truck made.<span>Know.</span></h2>
          <p>You already do the hard part — booking loads, driving miles, paying expenses and keeping the truck moving. MileVoxa helps you understand the business those miles are building.</p>
          <div className={styles.finalActions}>
            <Link href="/signup" className={styles.primaryButton}>Join the Free Beta</Link>
            <Link href="/tools" className={styles.secondaryButton}>Explore Free Tools</Link>
          </div>
          <small>Free during beta · No credit card required · Web + mobile account</small>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Link href="/" className={styles.footerBrand} aria-label="MileVoxa home">
            <Image unoptimized width={2499} height={556}
              src="/branding/milevoxa-logo-full-dark.png"
              alt="MileVoxa — Run your trucking business with clarity."
              className={styles.footerLogo}
            />
          </Link>
          <nav aria-label="Footer navigation">
            <Link href="/">Main Platform</Link>
            <Link href="/tools">Free Tools</Link>
            <Link href="/pricing">Pricing &amp; Beta</Link>
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/data-deletion">Data Deletion</Link>
            <Link href="/contact">Contact Team</Link>
          </nav>
          <span>© 2026 MileVoxa</span>
        </div>
      </footer>

      <HomepageStickyCta />
    </PublicLayout>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className={styles.sectionHeading}>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}


function AlertCard({ icon, title, body, meta, status, tone }: { icon: string; title: string; body: string; meta: string; status: string; tone: "amber" | "red" | "neutral" | "green" }) {
  const toneClass = { amber: styles.alertAmber, red: styles.alertRed, neutral: "", green: styles.alertGreen }[tone];
  return (
    <article className={`${styles.alertCard} ${toneClass}`}>
      <div className={styles.alertMain}><span className={styles.alertIcon}>{icon}</span><div><h3>{title}</h3><p>{body}</p><small>{meta}</small></div></div>
      <b>{status}</b>
    </article>
  );
}

function AiExample({ question, answer }: { question: string; answer: string }) {
  return <article className={styles.aiCard}><strong>Q: “{question}”</strong><p>{answer}</p></article>;
}
