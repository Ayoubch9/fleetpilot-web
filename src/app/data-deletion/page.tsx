import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/support";
import LegalPage, { LegalSection } from "@/components/legal-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Data Deletion",
  description:
    "Learn how to permanently delete a MileVoxa account, export supported data, and understand what is retained afterward.",
  path: "/data-deletion",
});

export default function DataDeletionPage() {
  return (
    <LegalPage
      eyebrow="ACCOUNT & DATA"
      title="MileVoxa Data Deletion"
      intro="MileVoxa provides self-service paths to permanently delete your account from the web application and mobile app."
    >
      <LegalSection title="Request account deletion">
        <p>
          If you can sign in, the fastest path is the self-service deletion
          flow described below. If you cannot access your account, you can send
          a deletion request from this public page. For security, MileVoxa may
          need to verify that you control the account before completing the
          request.
        </p>
        <div className="fp-legal-actions">
          <a
            className="fp-legal-primary-link"
            href={`mailto:${SUPPORT_EMAIL}?subject=MileVoxa%20Account%20Deletion%20Request`}
          >
            Request Account Deletion
          </a>
          <Link className="fp-legal-secondary-link" href="/contact">
            Contact Support
          </Link>
        </div>
      </LegalSection>

      <LegalSection title="Delete your account on the web">
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
      </LegalSection>

      <LegalSection title="Delete your account in the mobile app">
        <ol>
          <li>Open MileVoxa and sign in.</li>
          <li>Open Profile &amp; Company.</li>
          <li>Go to Danger Zone.</li>
          <li>Choose Delete Account and follow the confirmation steps.</li>
        </ol>
        <p>
          Account deletion is permanent. Export any records you need before
          confirming deletion.
        </p>
      </LegalSection>

      <LegalSection title="Company owners">
        <p>
          If you are the only owner/member of the company, account deletion may
          also remove the MileVoxa company workspace and eligible
          company-scoped operational records.
        </p>
        <p>
          If other company members remain, MileVoxa blocks owner deletion until
          ownership or membership access is resolved. This avoids deleting
          business data that other users still rely on.
        </p>
      </LegalSection>

      <LegalSection title="What is retained after deletion">
        <p>
          MileVoxa retains a minimal deletion marker containing the normalized
          account email and deletion metadata. It is not used to restore your
          former company data. It exists so a future Google sign-in with the
          same email does not silently create a new MileVoxa workspace.
        </p>
        <p>
          Limited information may also remain temporarily in backups, security
          logs, or where retention is required for legal, fraud-prevention, or
          system-integrity purposes. Eligible account and company data is
          otherwise permanently deleted through the deletion process.
        </p>
      </LegalSection>

      <LegalSection title="Signing in with Google after deletion">
        <p>
          If the same Google email signs in again, MileVoxa recognizes that the
          former account was deleted and shows a deleted-account screen. The old
          business records are not restored.
        </p>
        <p>
          The user can explicitly choose to create a new blank MileVoxa
          account. Only after that confirmation is the deletion marker removed
          and the user is sent through new-company onboarding.
        </p>
      </LegalSection>

      <LegalSection title="Need to start over or need help?">
        <p>
          If your deleted Google identity is currently signed in, use the
          deleted-account screen to explicitly create a new blank account.
          Otherwise, return to <Link href="/login">MileVoxa sign in</Link>.
        </p>
        <p>
          For deletion or privacy questions, contact <strong>{SUPPORT_EMAIL}</strong>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
