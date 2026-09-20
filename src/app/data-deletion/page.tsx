import Link from "next/link";
import LegalPage, { LegalSection } from "@/components/legal-page";

export const metadata = {
  title: "Data Deletion",
  description:
    "How to permanently delete a MileVoxa account and what happens afterward.",
};

export default function DataDeletionPage() {
  return (
    <LegalPage
      eyebrow="ACCOUNT & DATA"
      title="MileVoxa Data Deletion"
      intro="MileVoxa provides a self-service path to permanently delete your account from the web application."
    >
      <LegalSection title="Delete your account">
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

      <LegalSection title="Company owners">
        <p>
          If you are the only owner/member of the company, account deletion may
          also remove the MileVoxa company workspace and eligible
          company-scoped operational records.
        </p>
        <p>
          If other company members remain, MileVoxa blocks owner deletion
          until ownership or membership access is resolved. This avoids
          deleting business data that other users still rely on.
        </p>
      </LegalSection>

      <LegalSection title="What is retained after deletion">
        <p>
          MileVoxa retains a minimal deletion marker containing the
          normalized account email and deletion metadata. It is not used to
          restore your former company data. It exists so a future Google
          sign-in with the same email does not silently create a new
          MileVoxa workspace.
        </p>
        <p>
          Limited information may also remain temporarily in backups, security
          logs, or where retention is required for legal, fraud-prevention, or
          system-integrity purposes.
        </p>
      </LegalSection>

      <LegalSection title="Signing in with Google after deletion">
        <p>
          If the same Google email signs in again, MileVoxa recognizes that
          the former account was deleted and shows a deleted-account screen.
          The old business records are not restored.
        </p>
        <p>
          The user can explicitly choose to create a new blank MileVoxa
          account. Only after that confirmation is the deletion marker removed
          and the user is sent through new-company onboarding.
        </p>
      </LegalSection>

      <LegalSection title="Need to start over?">
        <p>
          If your deleted Google identity is currently signed in, use the
          deleted-account screen to explicitly create a new blank account.
          Otherwise, return to <Link href="/login">MileVoxa sign in</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
