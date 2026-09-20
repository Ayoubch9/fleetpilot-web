import LegalPage, { LegalSection } from "@/components/legal-page";

export const metadata = {
  title: "Terms of Service",
  description: "MileVoxa web application terms of service.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="LEGAL"
      title="Terms of Service"
      intro="These Terms govern use of the MileVoxa web application, including free trials, account features, trucking-business tools, and Google sign-in."
    >
      <LegalSection title="1. Using MileVoxa">
        <p>
          You may use MileVoxa only for lawful purposes and only if you are
          able to enter into a binding agreement where you live. You are
          responsible for the accuracy of information entered into your account
          and for activity performed through your credentials.
        </p>
      </LegalSection>

      <LegalSection title="2. Accounts and company workspaces">
        <p>
          MileVoxa accounts can be created with supported email credentials
          or Google sign-in. Company owners control company-level settings and
          are responsible for authorized member access.
        </p>
        <p>
          Do not attempt to access another company&apos;s records, bypass
          security controls, interfere with the service, or use MileVoxa for
          fraudulent or unlawful activity.
        </p>
      </LegalSection>

      <LegalSection title="3. Operational calculations">
        <p>
          MileVoxa provides calculations and summaries based on data entered
          by users, including profit, cost-per-mile, settlement, fuel,
          maintenance, security-deposit, and other operating views.
        </p>
        <p>
          These tools are informational business-management tools. They are not
          accounting, tax, legal, insurance, investment, or regulatory advice,
          and users remain responsible for verifying figures before relying on
          them for business decisions or official filings.
        </p>
      </LegalSection>

      <LegalSection title="4. Your data">
        <p>
          You retain responsibility for business information you enter. You
          grant MileVoxa the limited permission needed to host, process,
          display, calculate, back up, and transmit that information to operate
          the service for you.
        </p>
      </LegalSection>

      <LegalSection title="5. Free trial and paid features">
        <p>
          MileVoxa may offer a time-limited free trial. Paid billing,
          subscription prices, renewal terms, taxes, cancellation rules, and
          any additional commercial terms will be presented before a paid
          purchase is completed.
        </p>
      </LegalSection>

      <LegalSection title="6. Third-party services">
        <p>
          MileVoxa depends on third-party infrastructure and authentication
          providers such as Supabase, Vercel, and Google. Availability of those
          services can affect MileVoxa, and their separate terms may apply to
          your use of their services.
        </p>
      </LegalSection>

      <LegalSection title="7. Availability and changes">
        <p>
          MileVoxa may add, modify, suspend, or discontinue product features.
          The service may occasionally be unavailable for maintenance,
          provider outages, security work, or other operational reasons.
        </p>
      </LegalSection>

      <LegalSection title="8. Account termination and deletion">
        <p>
          You may delete your account from Settings → Security. If you are the
          sole owner/member of a company workspace, eligible company-scoped
          data is deleted with the account. If other members remain, MileVoxa
          may require ownership/member access to be resolved before deletion.
        </p>
        <p>
          MileVoxa may restrict or terminate access when reasonably necessary
          for security, abuse prevention, legal compliance, or material
          violation of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="9. Disclaimers">
        <p>
          MileVoxa is provided on an as-available basis. To the extent
          permitted by applicable law, MileVoxa does not guarantee that every
          calculation, import, third-party integration, or availability period
          will be error-free or uninterrupted.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitation of responsibility">
        <p>
          To the extent permitted by applicable law, MileVoxa is not
          responsible for business losses caused by inaccurate user-entered
          data, decisions made without independently verifying calculations,
          third-party outages, or unauthorized access caused by compromised
          user credentials.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to these Terms">
        <p>
          These Terms may be updated as MileVoxa develops. Continued use
          after updated Terms become effective may constitute acceptance where
          allowed by applicable law.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
