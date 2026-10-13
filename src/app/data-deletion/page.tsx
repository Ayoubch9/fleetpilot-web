import Link from "next/link";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { SUPPORT_EMAIL } from "@/lib/support";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";
import { publicPageMetadata } from "@/lib/seo";
import PublicLayout from "@/components/public-layout";
import {
  ToolsAnnouncement,
  ToolsFooter,
  ToolsHeader,
} from "../tools/tools-chrome";
import styles from "./data-deletion-redesign.module.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--mv-deletion-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--mv-deletion-mono",
  display: "swap",
});

export const metadata = publicPageMetadata({
  title: "Data Deletion",
  description:
    "Learn how to permanently delete a MileVoxa account, export supported data, and understand what is retained afterward.",
  path: "/data-deletion",
});

export default function DataDeletionPage() {
  return (
    <PublicLayout
      chrome="none"
      mainClassName={`${styles.page} ${jakarta.variable} ${mono.variable} mv-data-deletion-page`}
    >
      <ToolsAnnouncement />
      <ToolsHeader />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <span />
            ACCOUNT &amp; DATA CONTROL
          </div>

          <h1>Data Deletion</h1>

          <p>
            MileVoxa provides clear self-service paths to permanently delete
            your account from the web application and mobile app, with
            safeguards for company workspaces and account security.
          </p>

          <div className={styles.heroMeta}>
            <span>Last updated: {LEGAL_LAST_UPDATED}</span>
            <span>•</span>
            <span>Permanent account deletion</span>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.contentInner}>
          <article className={styles.commitmentCard}>
            <div className={styles.icon} aria-hidden="true">🗑️</div>
            <div>
              <h2>Your Account, Your Data, Your Choice</h2>
              <p>
                MileVoxa lets you permanently delete your account through the
                supported self-service flows. Before deleting, you can export
                supported account data. Deletion is permanent, and eligible
                account and company data is removed as described below.
              </p>
            </div>
          </article>

          <div className={styles.sections}>
            <DeletionSection label="SECTION 01" title="Request account deletion">
              <p>
                If you can sign in, the fastest path is the self-service
                deletion flow described below. If you cannot access your
                account, you can send a deletion request from this public page.
                For security, MileVoxa may need to verify that you control the
                account before completing the request.
              </p>

              <div className={styles.actionRow}>
                <a
                  className={styles.primaryAction}
                  href={`mailto:${SUPPORT_EMAIL}?subject=MileVoxa%20Account%20Deletion%20Request`}
                >
                  Request Account Deletion
                </a>
                <Link className={styles.secondaryAction} href="/contact">
                  Contact Support
                </Link>
              </div>
            </DeletionSection>

            <DeletionSection label="SECTION 02" title="Delete your account on the web">
              <ol>
                <li>Sign in to MileVoxa.</li>
                <li>Open Settings.</li>
                <li>Select Security.</li>
                <li>Choose Delete Account.</li>
                <li>Review the deletion notice and type DELETE to confirm.</li>
              </ol>
              <p>
                You can export supported account data from Settings → Data &amp;
                Export before deleting.
              </p>
            </DeletionSection>

            <DeletionSection label="SECTION 03" title="Delete your account in the mobile app">
              <ol>
                <li>Open MileVoxa and sign in.</li>
                <li>Open Profile &amp; Company.</li>
                <li>Go to Danger Zone.</li>
                <li>Choose Delete Account and follow the confirmation steps.</li>
              </ol>
              <p>
                Account deletion is permanent. Export any records you need
                before confirming deletion.
              </p>
            </DeletionSection>

            <DeletionSection label="SECTION 04" title="Company owners">
              <p>
                If you are the only owner/member of the company, account
                deletion may also remove the MileVoxa company workspace and
                eligible company-scoped operational records.
              </p>
              <p>
                If other company members remain, MileVoxa blocks owner deletion
                until ownership or membership access is resolved. This avoids
                deleting business data that other users still rely on.
              </p>
            </DeletionSection>

            <DeletionSection label="SECTION 05" title="What is retained after deletion">
              <p>
                MileVoxa retains a minimal deletion marker containing the
                normalized account email and deletion metadata. It is not used
                to restore your former company data. It exists so a future
                Google sign-in with the same email does not silently create a
                new MileVoxa workspace.
              </p>
              <p>
                Limited information may also remain temporarily in backups,
                security logs, or where retention is required for legal,
                fraud-prevention, or system-integrity purposes. Eligible
                account and company data is otherwise permanently deleted
                through the deletion process.
              </p>
            </DeletionSection>

            <DeletionSection label="SECTION 06" title="Signing in with Google after deletion">
              <p>
                If the same Google email signs in again, MileVoxa recognizes
                that the former account was deleted and shows a deleted-account
                screen. The old business records are not restored.
              </p>
              <p>
                The user can explicitly choose to create a new blank MileVoxa
                account. Only after that confirmation is the deletion marker
                removed and the user is sent through new-company onboarding.
              </p>
            </DeletionSection>

            <DeletionSection label="SECTION 07" title="Need to start over or need help?">
              <p>
                If your deleted Google identity is currently signed in, use the
                deleted-account screen to explicitly create a new blank account.
                Otherwise, return to <Link href="/login">MileVoxa sign in</Link>.
              </p>
              <p>
                For deletion or privacy questions, contact{" "}
                <strong>{SUPPORT_EMAIL}</strong>.
              </p>

              <div className={styles.contactBox}>
                <strong>MileVoxa Privacy &amp; Support</strong>
                <span>Email: {SUPPORT_EMAIL}</span>
                <Link href="/contact">Contact Team →</Link>
              </div>
            </DeletionSection>
          </div>
        </div>
      </section>

      <ToolsFooter />
    </PublicLayout>
  );
}

function DeletionSection({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.deletionCard}>
      <span className={styles.sectionLabel}>{label}</span>
      <h2>{title}</h2>
      <div className={styles.deletionBody}>{children}</div>
    </section>
  );
}
