import { SUPPORT_EMAIL } from "@/lib/support";
import LegalPage, { LegalSection } from "@/components/legal-page";
import { publicPageMetadata } from "@/lib/seo";
import { LEGAL_OPERATOR_NAME } from "@/lib/legal";

export const metadata = publicPageMetadata({
  title: "Privacy Policy",
  description:
    "Learn how MileVoxa collects, uses, protects, and retains account, analytics, and trucking-business data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="LEGAL"
      title="Privacy Policy"
      intro="This policy explains the information MileVoxa processes when you create an account, connect with Google, upload business records or receipts, use analytics-enabled website features, and use the web or mobile application."
    >
      <LegalSection title="Developer and privacy contact">
        <p>
          MileVoxa is operated by <strong>{LEGAL_OPERATOR_NAME}</strong>. This
          is the developer/business responsible for the MileVoxa service. For
          privacy questions or requests, contact{" "}
          <strong>{SUPPORT_EMAIL}</strong>.
        </p>
      </LegalSection>

      <LegalSection title="1. Information you provide">
        <p>
          MileVoxa may process account information such as your name, email
          address, company name, profile photo, preferences, and information you
          enter about your trucking operation.
        </p>

        <p>
          Trucking-business data may include trucks, loads, mileage, expenses,
          fuel, reimbursements, maintenance records, weekly settlements, fees,
          fixed expenses, company fee settings, security-deposit records,
          statements, uploaded documents, notes, and related operational
          records.
        </p>

        <p>
          When you upload a receipt image for expense entry, MileVoxa may
          process the image and recognized text to extract expense information
          such as merchant, date, amount, and other receipt details. Statement
          and document uploads are processed to provide the features you request
          and to keep your business records available in your workspace.
        </p>
      </LegalSection>

      <LegalSection title="2. Receipt OCR and Google ML Kit">
        <p>
          MileVoxa uses Google ML Kit text-recognition technology for receipt
          OCR. Receipt images and recognized receipt content are processed for
          expense extraction and related MileVoxa features.
        </p>

        <p>
          Google ML Kit may collect limited diagnostic or usage information in
          connection with the technology, such as device or app information,
          identifiers, performance metrics, and error or usage events. Google
          processes such information under its applicable terms and privacy
          practices.
        </p>
      </LegalSection>

      <LegalSection title="3. Public Beta feedback">
        <p>
          During the Public Beta, MileVoxa may collect feedback you choose to
          submit together with context needed to understand and respond to it.
          This may include user or company context, feedback category,
          experience rating, optional feedback tags, the page or feature from
          which feedback was submitted, your message, approximate session
          duration, and your contact preference.
        </p>
      </LegalSection>

      <LegalSection title="Technical information and browser storage">
        <p>
          When you use MileVoxa, technical information may be processed by
          MileVoxa or its service providers as part of hosting, authentication,
          security, diagnostics, analytics, and abuse prevention. This can
          include IP address, browser or device type, operating system, request
          timestamps, app or browser diagnostics, referral information, and
          security-related events.
        </p>

        <p>
          The web application also uses cookies and similar browser storage for
          service functionality. Authentication may use cookies, and MileVoxa
          uses localStorage or sessionStorage for limited product preferences
          and session features, such as Public Beta feedback cooldowns and
          session timing.
        </p>

        <p>
          MileVoxa does not use these functional storage mechanisms to sell
          personal information or build third-party advertising profiles.
        </p>
      </LegalSection>

      <LegalSection title="Analytics and website usage">
        <p>
          MileVoxa uses Google Analytics 4 (GA4) to understand how visitors use
          the MileVoxa website, measure traffic and product engagement,
          understand which pages and features are useful, evaluate the
          effectiveness of website and marketing traffic, and improve the
          service.
        </p>

        <p>
          Google Analytics may process information such as pages viewed,
          session activity, browser and device information, approximate
          geographic information derived from network information, referral or
          traffic source, and interactions with MileVoxa website features.
        </p>

        <p>
          MileVoxa may send limited product and conversion events to Google
          Analytics. These may include events indicating that a visitor clicked
          a Public Beta signup link, completed account signup or login, opened
          or used a free tool, used the Load Decision Center, or successfully
          submitted Public Beta feedback.
        </p>

        <p>
          MileVoxa does not intentionally send Google Analytics sensitive
          trucking-business information such as load rates, profit amounts,
          expense amounts, broker or customer names, load numbers, pickup or
          delivery locations, receipt contents, uploaded documents, or the text
          of written feedback messages.
        </p>

        <p>
          Analytics events may include limited non-sensitive context needed to
          understand product usage, such as the page from which an action
          occurred, authentication method, feature name, load-decision rating
          category, whether recorded fuel history was available, feedback
          rating, or number of selected feedback tags.
        </p>

        <p>
          Google processes Google Analytics information according to
          Google&apos;s applicable terms and privacy practices. Browser or
          device privacy settings may allow you to restrict certain cookies or
          tracking technologies, although changing those settings may affect
          some website functionality.
        </p>
      </LegalSection>

      <LegalSection title="4. Google sign-in">
        <p>
          If you choose Continue with Google, MileVoxa uses Supabase
          authentication to complete the Google OAuth flow. MileVoxa may receive
          the Google account identifier, email address, and profile information
          Google makes available for authentication.
        </p>

        <p>
          MileVoxa does not receive your Google password and does not use Google
          sign-in to access your Gmail inbox, Google Drive files, or unrelated
          Google account content.
        </p>
      </LegalSection>

      <LegalSection title="5. How information is used">
        <p>
          Information is used to authenticate users, maintain company
          workspaces, store and organize trucking-business records, perform
          requested OCR/expense extraction, calculate operational and
          profitability views, provide exports and reports, synchronize
          settings, measure website and product engagement, understand feature
          usage, respond to Public Beta feedback, protect account security,
          troubleshoot the service, and improve MileVoxa.
        </p>
      </LegalSection>

      <LegalSection title="6. Service providers">
        <p>
          MileVoxa relies on service providers to operate the product, including
          Supabase for backend database, authentication, and storage services;
          Google for Google authentication, Google ML Kit receipt OCR, and
          Google Analytics 4 website and product analytics; Vercel for web
          hosting and delivery; and, where paid billing is enabled, Stripe for
          hosted checkout and subscription billing.
        </p>

        <p>
          Stripe may process billing contact and payment information needed to
          complete a transaction. MileVoxa does not receive or store the full
          payment-card number entered into Stripe Checkout.
        </p>

        <p>
          These providers may process information as necessary to provide their
          services and according to their own applicable terms and privacy
          practices.
        </p>
      </LegalSection>

      <LegalSection title="7. Data sharing and sale">
        <p>
          MileVoxa does not sell personal information or trucking-business
          records. Information may be disclosed to service providers as needed
          to operate requested features, provide analytics and infrastructure,
          protect MileVoxa or its users, comply with applicable legal
          obligations, or complete a transaction you request.
        </p>
      </LegalSection>

      <LegalSection title="8. Data retention and account deletion">
        <p>
          Active account and company data is retained while needed to provide
          MileVoxa and for legitimate security, operational, and legal
          purposes. You can export supported account data from Settings and
          permanently delete your account using MileVoxa&apos;s self-service
          deletion flow.
        </p>

        <p>
          Mobile users can use Profile &amp; Company → Danger Zone → Delete
          Account. Web deletion instructions are available on the Data Deletion
          page.
        </p>

        <p>
          After self-service deletion, MileVoxa retains a minimal deletion
          marker containing the normalized account email and deletion metadata.
          Its purpose is to prevent a later Google sign-in from silently
          recreating the deleted MileVoxa account. If you explicitly choose to
          start a new blank account, that marker is removed.
        </p>

        <p>
          Some information may remain for a limited period in backups, security
          logs, analytics systems, or where retention is required to address
          fraud, disputes, legal obligations, or system integrity. Eligible
          account and company data is otherwise permanently deleted through the
          deletion process.
        </p>
      </LegalSection>

      <LegalSection title="9. Security">
        <p>
          MileVoxa uses encrypted transmission (HTTPS/TLS) where supported by
          the service, authenticated access controls, and company-scoped
          database rules to help protect information in transit and restrict
          access.
        </p>

        <p>
          No online system can guarantee absolute security, so users should also
          protect their sign-in credentials and device access.
        </p>
      </LegalSection>

      <LegalSection title="10. Free Public Beta">
        <p>
          MileVoxa is currently offered as a Free Public Beta. Beta access is
          free and no credit card is required. Features, workflows, limits, and
          availability may change as the product is tested and improved.
        </p>

        <p>
          Paid plans may be introduced later. MileVoxa will provide advance
          notice before free beta access materially changes.
        </p>
      </LegalSection>

      <LegalSection title="11. Business, financial, accounting, and legal disclaimer">
        <p>
          MileVoxa is a business-management tool. Calculations and analytics,
          including profit, cost per mile (CPM), revenue per mile (RPM),
          settlements, expenses, and fuel analytics, depend on information
          entered or imported by users and may be incomplete or inaccurate if
          the underlying records are incomplete or inaccurate.
        </p>

        <p>
          MileVoxa does not provide tax, accounting, legal, investment,
          employment, or regulatory advice. Users are responsible for verifying
          their records and calculations before relying on them for taxes,
          payroll, driver or company settlements, regulatory compliance, or
          other significant business decisions.
        </p>

        <p>
          Consult an appropriate qualified professional when needed.
        </p>
      </LegalSection>

      <LegalSection title="12. Your choices">
        <p>
          You can update account/company information, manage supported uploads,
          export supported data, sign out, or delete your MileVoxa account.
          Google account permissions can also be reviewed from your Google
          account.
        </p>

        <p>
          Depending on your browser, device, location, and applicable law, you
          may also have controls relating to cookies or analytics technologies.
        </p>
      </LegalSection>

      <LegalSection title="13. Children">
        <p>
          MileVoxa is a business productivity service and is not directed to
          children. Users should only create an account if they are legally able
          to use the service in their jurisdiction.
        </p>
      </LegalSection>

      <LegalSection title="Regional privacy choices">
        <p>
          Depending on where you live, applicable privacy law may provide
          additional rights concerning access, correction, deletion, or other
          handling of personal information.
        </p>

        <p>
          You can use MileVoxa&apos;s self-service account tools where available
          or contact <strong>{SUPPORT_EMAIL}</strong> to make a privacy request.
          MileVoxa may need to verify the request before acting on it.
        </p>
      </LegalSection>

      <LegalSection title="14. Policy changes">
        <p>
          MileVoxa may update this policy as the product, analytics practices,
          legal requirements, or service providers change. The updated date at
          the top identifies the current published version.
        </p>
      </LegalSection>

      <LegalSection title="15. Privacy, deletion, and support requests">
        <p>
          Signed-in users can manage privacy-related actions through MileVoxa.
          Account deletion instructions are also available on the public Data
          Deletion page.
        </p>

        <p>
          For privacy, deletion, or support questions, contact MileVoxa at{" "}
          <strong>{SUPPORT_EMAIL}</strong>. We aim to respond to support
          inquiries within 48 hours.
        </p>
      </LegalSection>
    </LegalPage>
  );
}