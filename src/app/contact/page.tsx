import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import {
  SUPPORT_EMAIL,
  SUPPORT_RESPONSE_TIME,
} from "@/lib/support";
import { publicPageMetadata } from "@/lib/seo";
import PublicLayout from "@/components/public-layout";
import {
  ToolsAnnouncement,
  ToolsFooter,
  ToolsHeader,
} from "../tools/tools-chrome";
import ContactForm from "./contact-form";
import styles from "./contact-redesign.module.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--mv-contact-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--mv-contact-mono",
  display: "swap",
});

export const metadata = publicPageMetadata({
  title: "Contact MileVoxa",
  description:
    "Contact MileVoxa support for account, billing, privacy, or product questions, with an expected response within 48 hours.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <PublicLayout
      chrome="none"
      mainClassName={`${styles.page} ${jakarta.variable} ${mono.variable} mv-contact-page`}
    >
      <ToolsAnnouncement />
      <ToolsHeader />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <span />
            DIRECT CARRIER COMMUNICATION
          </div>

          <h1>
            Talk Directly With the <span>MileVoxa Team</span>
          </h1>

          <p>
            Contact MileVoxa about your account, billing, privacy, or product
            questions. We keep support direct, practical, and focused on your
            trucking operation.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.contentInner}>
          <div className={styles.infoGrid}>
            <article className={styles.infoCard}>
              <div>
                <div className={styles.infoIcon} aria-hidden="true">✉️</div>
                <h2>Direct Support Inbox</h2>
                <p>
                  Use this address for account, billing, privacy, or product
                  support.
                </p>
              </div>
              <a href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL} →
              </a>
            </article>

            <article className={styles.infoCard}>
              <div>
                <div className={styles.infoIcon} aria-hidden="true">🛠️</div>
                <h2>Public Beta Feedback</h2>
                <p>
                  Share product feedback, feature requests, or questions about
                  MileVoxa workflows and calculations.
                </p>
              </div>
              <span className={styles.infoMeta}>Product feedback welcome</span>
            </article>

            <article className={styles.infoCard}>
              <div>
                <div className={styles.infoIcon} aria-hidden="true">⏱️</div>
                <h2>Response Time</h2>
                <p>
                  We aim to respond to support inquiries within our published
                  support timeframe.
                </p>
              </div>
              <span className={styles.infoMetaGreen}>
                {SUPPORT_RESPONSE_TIME}
              </span>
            </article>
          </div>

          <div className={styles.formCard}>
            <div className={styles.formHeading}>
              <h2>Send Us a Direct Message</h2>
              <p>
                Fill out the fields below and we&apos;ll prepare a support email
                addressed directly to the MileVoxa team.
              </p>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      <ToolsFooter />
    </PublicLayout>
  );
}
