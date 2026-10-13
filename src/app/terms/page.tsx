import Link from "next/link";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { SUPPORT_EMAIL } from "@/lib/support";
import { LEGAL_LAST_UPDATED, LEGAL_OPERATOR_NAME } from "@/lib/legal";
import { publicPageMetadata } from "@/lib/seo";
import PublicLayout from "@/components/public-layout";
import {
  ToolsAnnouncement,
  ToolsFooter,
  ToolsHeader,
} from "../tools/tools-chrome";
import styles from "./terms-redesign.module.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--mv-terms-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--mv-terms-mono",
  display: "swap",
});

export const metadata = publicPageMetadata({
  title: "Terms of Service",
  description:
    "Read the MileVoxa terms covering public beta access, accounts, future paid subscriptions, refunds, cancellation, and service use.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PublicLayout
      chrome="none"
      mainClassName={`${styles.page} ${jakarta.variable} ${mono.variable} mv-terms-page`}
    >
      <ToolsAnnouncement />
      <ToolsHeader />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <span />
            PLATFORM TERMS &amp; BETA ACCESS
          </div>

          <h1>Terms of Service</h1>

          <p>
            These Terms govern use of the MileVoxa web application, including
            public beta access, account features, trucking-business tools, and
            Google sign-in.
          </p>

          <div className={styles.heroMeta}>
            <span>Last updated: {LEGAL_LAST_UPDATED}</span>
            <span>•</span>
            <span>Public Beta</span>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.contentInner}>
          <article className={styles.commitmentCard}>
            <div className={styles.icon} aria-hidden="true">⚖️</div>
            <div>
              <h2>Plain-English Service Terms</h2>
              <p>
                MileVoxa is built as a practical trucking-business operating
                system. These Terms explain what you can expect from the
                service, what is expected from account holders, and how Public
                Beta access, future billing, data use, and service availability
                are handled.
              </p>
            </div>
          </article>

          <div className={styles.sections}>
            <TermsSection label="SECTION 01" title="Operator and contact">
              <p>
                MileVoxa is operated by <strong>{LEGAL_OPERATOR_NAME}</strong>.
                For account, billing, privacy, or service questions, contact
                <strong> {SUPPORT_EMAIL}</strong>.
              </p>
            </TermsSection>

            <TermsSection label="SECTION 02" title="Using MileVoxa">
              <p>
                You may use MileVoxa only for lawful purposes and only if you are
                able to enter into a binding agreement where you live. You are
                responsible for the accuracy of information entered into your
                account and for activity performed through your credentials.
              </p>
            </TermsSection>

            <TermsSection label="SECTION 03" title="Accounts and company workspaces">
              <p>
                MileVoxa accounts can be created with supported email
                credentials or Google sign-in. Company owners control
                company-level settings and are responsible for authorized member
                access.
              </p>
              <p>
                Do not attempt to access another company&apos;s records, bypass
                security controls, interfere with the service, introduce
                malicious code, use automated scraping or requests that
                materially burden the service, reverse engineer the service
                except where applicable law expressly permits it, or use
                MileVoxa for fraudulent or unlawful activity.
              </p>
            </TermsSection>

            <TermsSection label="SECTION 04" title="Operational calculations">
              <p>
                MileVoxa provides calculations and summaries based on data
                entered by users, including profit, cost-per-mile, settlement,
                fuel, maintenance, security-deposit, and other operating views.
              </p>
              <p>
                These tools are informational business-management tools. They are
                not accounting, tax, legal, insurance, investment, or regulatory
                advice, and users remain responsible for verifying figures
                before relying on them for business decisions or official
                filings.
              </p>
            </TermsSection>

            <TermsSection label="SECTION 05" title="Your data">
              <p>
                You retain responsibility for business information you enter.
                You grant MileVoxa the limited permission needed to host,
                process, display, calculate, back up, and transmit that
                information to operate the service for you.
              </p>
            </TermsSection>

            <TermsSection
              label="SECTION 06"
              title="MileVoxa software and intellectual property"
            >
              <p>
                MileVoxa and its software, interface, branding, documentation,
                and service content are protected by applicable
                intellectual-property laws. Subject to these Terms, MileVoxa
                gives you a limited, non-exclusive, non-transferable right to
                use the service for your permitted business purposes during the
                period in which you have authorized access.
              </p>
            </TermsSection>

            <TermsSection
              label="SECTION 07"
              title="Public beta, future billing, refunds, and cancellation"
            >
              <p>
                MileVoxa is currently offered as a free public beta for eligible
                users. No payment card or checkout is required for beta access.
                The public beta is temporary and is not a promise that MileVoxa
                will remain free forever.
              </p>
              <p>
                MileVoxa may announce paid plans later. We intend to give
                advance notice before free beta access changes. Beta access will
                not automatically convert into a paid subscription, and
                starting a future paid plan will require explicit action by the
                company owner or other authorized account holder.
              </p>
              <p>
                <strong>Existing paid subscriptions.</strong> If an account
                already has an active paid subscription from an earlier billing
                phase, that billing relationship is not automatically cancelled,
                refunded, or modified merely because MileVoxa is running a
                public beta. Contact <strong>{SUPPORT_EMAIL}</strong> with
                billing questions.
              </p>
              <p>
                <strong>Refund policy.</strong> Paid MileVoxa subscription
                charges are generally non-refundable once a billing period has
                started, except where a refund is required by applicable law or
                where MileVoxa confirms a duplicate or erroneous charge.
              </p>
              <p>
                <strong>Cancellation.</strong> A company owner with an existing
                paid subscription may use the available billing-management
                process to cancel it. Cancellation takes effect according to the
                paid billing terms that apply to that subscription.
              </p>
            </TermsSection>

            <TermsSection label="SECTION 08" title="Third-party services">
              <p>
                MileVoxa depends on third-party infrastructure, authentication,
                OCR, and billing providers such as Supabase, Vercel, Google,
                and, where billing is enabled, Stripe. Availability of those
                services can affect MileVoxa, and their separate terms may apply
                to your use of their services.
              </p>
            </TermsSection>

            <TermsSection label="SECTION 09" title="Availability and changes">
              <p>
                MileVoxa may add, modify, suspend, or discontinue product
                features. The service may occasionally be unavailable for
                maintenance, provider outages, security work, or other
                operational reasons.
              </p>
            </TermsSection>

            <TermsSection
              label="SECTION 10"
              title="Account termination and deletion"
            >
              <p>
                You may delete your account from Settings → Security. If you are
                the sole owner/member of a company workspace, eligible
                company-scoped data is deleted with the account. If other
                members remain, MileVoxa may require ownership/member access to
                be resolved before deletion.
              </p>
              <p>
                MileVoxa may restrict or terminate access when reasonably
                necessary for security, abuse prevention, legal compliance, or
                material violation of these Terms.
              </p>
              <p>
                Public account deletion instructions are also available on the{" "}
                <Link href="/data-deletion">Data Deletion page</Link>.
              </p>
            </TermsSection>

            <TermsSection label="SECTION 11" title="Disclaimers">
              <p>
                MileVoxa is provided on an as-available basis. To the extent
                permitted by applicable law, MileVoxa does not guarantee that
                every calculation, import, third-party integration, or
                availability period will be error-free or uninterrupted.
              </p>
            </TermsSection>

            <TermsSection label="SECTION 12" title="Limitation of responsibility">
              <p>
                To the extent permitted by applicable law, MileVoxa is not
                responsible for business losses caused by inaccurate
                user-entered data, decisions made without independently
                verifying calculations, third-party outages, or unauthorized
                access caused by compromised user credentials.
              </p>
            </TermsSection>

            <TermsSection label="SECTION 13" title="Changes to these Terms">
              <p>
                These Terms may be updated as MileVoxa develops. Continued use
                after updated Terms become effective may constitute acceptance
                where allowed by applicable law.
              </p>

              <div className={styles.contactBox}>
                <strong>MileVoxa Support</strong>
                <span>Email: {SUPPORT_EMAIL}</span>
                <Link href="/contact">Contact Team →</Link>
              </div>
            </TermsSection>
          </div>
        </div>
      </section>

      <ToolsFooter />
    </PublicLayout>
  );
}

function TermsSection({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.termsCard}>
      <span className={styles.sectionLabel}>{label}</span>
      <h2>{title}</h2>
      <div className={styles.termsBody}>{children}</div>
    </section>
  );
}
