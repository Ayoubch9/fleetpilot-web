import LegalPage, { LegalSection } from "@/components/legal-page";

export const metadata = {
  title: "Privacy Policy",
  description: "How FleetPilot handles account and trucking-business data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="LEGAL"
      title="Privacy Policy"
      intro="This policy explains the information FleetPilot processes when you create an account, connect with Google, and use the web application."
    >
      <LegalSection title="1. Information you provide">
        <p>
          FleetPilot may process account information such as your name, email
          address, company name, profile photo, preferences, and information you
          enter about your trucking operation.
        </p>
        <p>
          Business data may include trucks, loads, expenses, reimbursements,
          maintenance records, fuel information, weekly settlements, fixed
          expenses, company fee settings, security-deposit transactions,
          documents, notes, and related operational records.
        </p>
      </LegalSection>

      <LegalSection title="2. Google sign-in">
        <p>
          If you choose Continue with Google, FleetPilot uses Supabase
          authentication to complete the Google OAuth flow. FleetPilot may
          receive the Google account identifier, email address, and profile
          information Google makes available for authentication.
        </p>
        <p>
          FleetPilot does not receive your Google password and does not use
          Google sign-in to access your Gmail inbox, Google Drive files, or
          unrelated Google account content.
        </p>
      </LegalSection>

      <LegalSection title="3. How information is used">
        <p>
          Information is used to authenticate users, maintain company
          workspaces, calculate operational and profitability views, provide
          exports and reports, keep settings synchronized, protect account
          security, troubleshoot the service, and improve FleetPilot.
        </p>
      </LegalSection>

      <LegalSection title="4. Service providers">
        <p>
          FleetPilot relies on service providers to operate the product,
          including Supabase for authentication/database services, Vercel for
          web hosting and delivery, and Google when you choose Google sign-in.
          Those providers process information according to their own terms and
          privacy practices.
        </p>
      </LegalSection>

      <LegalSection title="5. Data sharing and sale">
        <p>
          FleetPilot is not designed to sell personal information or trucking
          business records to advertisers. Information may be disclosed when
          needed to operate the service, protect FleetPilot or its users,
          comply with applicable legal obligations, or complete a transaction
          you request.
        </p>
      </LegalSection>

      <LegalSection title="6. Data retention and account deletion">
        <p>
          Active account and company data is kept while needed to provide
          FleetPilot. You can export supported account data from Settings and
          can permanently delete your account from Settings → Security.
        </p>
        <p>
          After self-service deletion, FleetPilot retains a minimal deletion
          marker containing the normalized account email and deletion metadata.
          Its purpose is to prevent a later Google sign-in from silently
          recreating the deleted FleetPilot account. If you explicitly choose
          to start a new blank account, that marker is removed.
        </p>
        <p>
          Some information may remain for a limited period in backups, security
          records, or where retention is required to address fraud, disputes,
          legal obligations, or system integrity.
        </p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>
          FleetPilot uses authenticated access controls and company-scoped
          database rules. No online system can guarantee absolute security, so
          users should protect their sign-in credentials and device access.
        </p>
      </LegalSection>

      <LegalSection title="8. Your choices">
        <p>
          You can update account/company information in Settings, export
          supported data, sign out, or delete your FleetPilot account. Google
          account permissions can also be reviewed from your Google account.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>
          FleetPilot is a business productivity service and is not directed to
          children. Users should only create an account if they are legally
          able to use the service in their jurisdiction.
        </p>
      </LegalSection>

      <LegalSection title="10. Policy changes">
        <p>
          FleetPilot may update this policy as the product, legal requirements,
          or service providers change. The updated date at the top identifies
          the current published version.
        </p>
      </LegalSection>

      <LegalSection title="11. Privacy and deletion requests">
        <p>
          Signed-in users can manage privacy-related actions through FleetPilot
          Settings. Account deletion instructions are also available on the
          public Data Deletion page.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
