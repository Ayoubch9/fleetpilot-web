import type { Metadata } from "next";
import PublicLayout from "@/components/public-layout";
import Link from "next/link";
import { publicPageMetadata } from "@/lib/seo";
import PricingPlans from "./pricing-plans";

export const metadata: Metadata = publicPageMetadata({
  title: "Pricing | MileVoxa - Plans from $19/mo per Company",
  description:
    "MileVoxa pricing starts at $19/month per company, not per truck or driver. Every plan includes a 14-day free trial with no credit card required.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <PublicLayout mainClassName="mv-pricing-page fp-marketing fp-pricing-page min-h-screen bg-[#F7F9F8] text-[#0B1730]">
      <section className="fp-pricing-hero">
        <span>Simple MileVoxa pricing</span>
        <h1>Pricing that doesn&apos;t punish you for growing.</h1>
        <p>
          One flat price per company — not per truck, not per driver. Every plan
          starts with a 14-day free trial. No credit card required.
        </p>
      </section>

      <section className="mv-founder-offer" aria-label="Founding member offer">
        <span>FOUNDING MEMBER OFFER</span>
        <strong>
          Founding member offer: the first 100 companies lock the Fleet plan at
          $19/month forever.
        </strong>
      </section>

      <PricingPlans />

      <section className="fp-pricing-compare">
        <div className="fp-marketing-section-heading compact">
          <div>
            <span>What you get</span>
            <h2>More than a load tracker.</h2>
          </div>
          <p>
            MileVoxa is meant to replace the disconnected process around the
            load—not just store load numbers.
          </p>
        </div>

        <div className="fp-pricing-value-grid">
          <ValueCard
            title="Operations"
            text="Loads, trucks, documents and maintenance stay connected."
          />
          <ValueCard
            title="Financial clarity"
            text="Expenses, fuel, reimbursements, fees and settlement show the real weekly result."
          />
          <ValueCard
            title="Decision support"
            text="Reports, alerts, comparisons and Pilot AI help turn operating history into action."
          />
        </div>
      </section>

      <section className="fp-pricing-faq" aria-labelledby="pricing-faq-title">
        <div className="fp-marketing-section-heading compact">
          <div>
            <span>Pricing FAQ</span>
            <h2 id="pricing-faq-title">Before you subscribe.</h2>
          </div>
          <p>
            Simple company pricing, the same no-card trial, and the existing
            cancellation and refund terms.
          </p>
        </div>

        <div className="fp-pricing-faq-grid">
          <PricingFaq
            question="Is pricing per company or per truck?"
            answer="Pricing is per company, not per truck. Solo includes 1 truck, Fleet includes up to 5 trucks, and Pro includes up to 15 trucks."
          />
          <PricingFaq
            question="Will I be charged during the 14-day trial?"
            answer="No. Every plan starts with a 14-day free trial and no credit card is required, so there is no charge during the trial."
          />
          <PricingFaq
            question="Are drivers charged separately?"
            answer="No. Fleet and Pro include unlimited drivers. Driver count does not create an additional per-driver charge."
          />
          <PricingFaq
            question="How do I cancel?"
            answer="Once paid billing is enabled and you have an active subscription, the company owner can manage or cancel it through the Stripe billing portal. There is nothing to cancel during the no-card free trial."
          />
          <PricingFaq
            question="What is the refund policy?"
            answer="MileVoxa does not currently publish a separate refund policy because paid checkout is not yet enabled in the product UI. Any applicable refund or purchase terms will be presented before a paid purchase is completed. Until checkout is enabled and completed, there is no subscription charge to refund."
          />
        </div>
      </section>

      <section className="fp-marketing-final-cta">
        <div>
          <span>Start without a card</span>
          <h2>Give MileVoxa one real week of your data.</h2>
          <p>
            You will know quickly whether having the operation in one place
            changes the way you run it.
          </p>
        </div>
        <div>
          <Link href="/signup" className="fp-marketing-button primary large">
            Start Free Trial →
          </Link>
          <Link href="/" className="fp-marketing-button ghost large">
            Back to Home
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}

function PricingFaq({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="fp-pricing-faq-item">
      <summary>
        {question}
        <span>+</span>
      </summary>
      <p>{answer}</p>
    </details>
  );
}

function ValueCard({ title, text }: { title: string; text: string }) {
  return (
    <article>
      <span>✓</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
