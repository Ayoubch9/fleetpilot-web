import { SUPPORT_EMAIL } from "@/lib/support";
import LegalPage, { LegalSection } from "@/components/legal-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Privacy Policy",
  description:
    "Learn how MileVoxa collects, uses, protects, and retains account and trucking-business data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="LEGAL"
      title="Privacy Policy"
      intro="This policy explains the information MileVoxa processes when you create an account, connect with Google, and use the web or mobile application."
      updated="October 5, 2026"
    >
      <LegalSection title="1. Information you provide">
        <p>
          MileVoxa may process account information such as your name, email
          address, company name, profile photo, preferences, and information you
          enter about your trucking operation.
        </p>
        <p>
          Business data may include trucks, loads, mileage, expenses, reimbursements,
          maintenance records, fuel information, weekly settlements, fixed
          expenses, company fee settings, security-deposit transactions,
          uploaded statements, documents, receipt images, notes, and related operational records.
        </p>
        <p>
          Public Beta feedback may include your message, user and company
          context, feedback category, page context, and preference about being
          contacted. We use this information to review feedback, troubleshoot
          issues, improve the product, and follow up according to your contact preference.
        </p>
      </LegalSection>

      <LegalSection title="2. Google sign-in">
        <p>
          If you choose Continue with Google, MileVoxa uses Supabase
          authentication to complete the Google OAuth flow. MileVoxa may
          receive the Google account identifier, email address, and profile
          information Google makes available for authentication.
        </p>
        <p>
          MileVoxa does not receive your Google password and does not use
          Google sign-in to access your Gmail inbox, Google Drive files, or
          unrelated Google account content.
        </p>
      </LegalSection>

      <LegalSection title="3. How information is used">
        <p>
          Information is used to authenticate users, maintain company
          workspaces, calculate operational and profitability views, provide
          exports and reports, keep settings synchronized, protect account
          security, troubleshoot the service, and improve MileVoxa.
        </p>
        <p>
          Receipt images and recognized text are processed to extract expense
          information. The mobile app uses Google ML Kit for receipt OCR
          (optical character recognition/text recognition). ML Kit processes
          OCR input on your device and does not send receipt content or OCR
          results to Google servers. Receipt images you upload and expense data
          you save may be stored in MileVoxa through Supabase.
        </p>
        <p>
          Separately from receipt content, ML Kit may collect limited diagnostic
          and usage information, such as device and app information, identifiers,
          performance metrics, and error and usage events, to maintain and improve
          its services. See Google's{" "}
          <a href="https://developers.google.com/ml-kit/android-data-disclosure">
            ML Kit data disclosure
          </a>{" "}
          for details.
        </p>
      </LegalSection>

      <LegalSection title="4. Service providers">
        <p>
          MileVoxa relies on service providers to operate the product,
          including Supabase for backend, authentication, database, and storage
          services; Vercel for web hosting and delivery; and Google for Google
          authentication and ML Kit receipt OCR.
          Those providers process information according to their own terms and
          privacy practices.
        </p>
      </LegalSection>

      <LegalSection title="5. Data sharing and sale">
        <p>
          MileVoxa does not sell personal information or trucking business
          records. Information may be disclosed when
          needed to operate the service, protect MileVoxa or its users,
          comply with applicable legal obligations, or complete a transaction
          you request.
        </p>
      </LegalSection>

      <LegalSection title="6. Data retention and account deletion">
        <p>
          Active account and company data is kept while needed to provide
          MileVoxa. You can export supported account data from Settings and
          can permanently delete your account from Settings → Security.
          In the mobile app, open Profile &amp; Company → Danger Zone → Delete Account.
        </p>
        <p>
          After self-service deletion, MileVoxa retains a minimal deletion
          marker containing the normalized account email and deletion metadata.
          Its purpose is to prevent a later Google sign-in from silently
          recreating the deleted MileVoxa account. If you explicitly choose
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
          MileVoxa uses HTTPS/TLS encryption for data transmitted between the
          app or website and its services, authenticated access controls, and
          company-scoped database rules. No online system can guarantee absolute security, so
          users should protect their sign-in credentials and device access.
        </p>
      </LegalSection>

      <LegalSection title="8. Your choices">
        <p>
          You can update account/company information in Settings, export
          supported data, sign out, or delete your MileVoxa account. Google
          account permissions can also be reviewed from your Google account.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>
          MileVoxa is a business productivity service and is not directed to
          children. Users should only create an account if they are legally
          able to use the service in their jurisdiction.
        </p>
      </LegalSection>

      <LegalSection title="10. Policy changes">
        <p>
          MileVoxa may update this policy as the product, legal requirements,
          or service providers change. The updated date at the top identifies
          the current published version. Material changes will be communicated
          through appropriate in-app or account notices.
        </p>
      </LegalSection>

      <LegalSection title="11. Privacy and deletion requests">
        <p>
          Signed-in users can manage privacy-related actions through MileVoxa
          Settings. Account deletion instructions are also available on the
          public Data Deletion page.
        </p>
        <p>
          For privacy, deletion, or support questions, contact MileVoxa at{" "}
          <a href={`mailto:${SUPPORT_EMAIL.toLowerCase()}`}>support@milevoxa.com</a>. We aim to respond to support
          inquiries within 48 hours.
        </p>
      </LegalSection>
      <LegalSection title="12. Free Public Beta">
        <p>
          MileVoxa is currently in Free Public Beta: access is free during beta
          and no credit card is required. Features may change as we improve the
          service. Paid plans may be introduced later, and users will receive
          advance notice before free beta access materially changes.
        </p>
      </LegalSection>
      <LegalSection title="13. Business calculations and professional advice">
        <p>
          MileVoxa is a business-management tool. Profit, cost-per-mile, RPM
          (revenue per mile), settlements, expenses, and fuel analytics depend
          on user-entered or imported data and may be incomplete or inaccurate.
          Review OCR-extracted information before saving or relying on it.
        </p>
        <p>
          MileVoxa does not provide tax, accounting, legal, investment,
          employment, or regulatory advice. Users should verify records and
          calculations before using them for taxes, payroll, settlements,
          compliance, or major business decisions, and consult qualified
          professionals where appropriate.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
