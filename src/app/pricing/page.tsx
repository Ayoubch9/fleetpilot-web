import type { Metadata } from "next";
import PublicLayout from "@/components/public-layout";
import Link from "next/link";
import { publicPageMetadata } from "@/lib/seo";
import PricingPlans from "./pricing-plans";

export const metadata: Metadata = publicPageMetadata({
  title: "Public Beta Access | MileVoxa",
  description:
    "Join the free MileVoxa public beta. No credit card required. Paid plans will be announced later and beta users will not be charged automatically.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <PublicLayout mainClassName="mv-pricing-page fp-marketing fp-pricing-page min-h-screen bg-[#F7F9F8] text-[#0B1730]">
      <section className="fp-pricing-hero">
        <span>PUBLIC BETA</span>
        <h1>Free access while we build MileVoxa with truckers.</h1>
        <p>
          MileVoxa is currently in free public beta. Use the core product without
          entering a payment card, then tell us what should be clearer, faster, or better.
        </p>
      </section>

      <section className="mv-beta-pricing-notice" aria-label="Public beta terms">
        <span>FREE DURING BETA</span>
        <strong>No credit card required. No automatic paid enrollment.</strong>
        <p>
          Paid plans will be announced later. We will give users advance notice before
          free beta access changes, and starting a paid plan will require explicit action.
        </p>
      </section>

      <PricingPlans />

      <section className="fp-pricing-compare">
        <div className="fp-marketing-section-heading compact">
          <div>
            <span>What you can test</span>
            <h2>Run real trucking workflows in one place.</h2>
          </div>
          <p>
            The beta is for testing the product with real operations and giving us
            useful feedback—not for promising future features or pricing before they are ready.
          </p>
        </div>

        <div className="fp-pricing-value-grid">
          <ValueCard title="Operations" text="Manage loads, trucks, documents and maintenance." />
          <ValueCard title="Financial clarity" text="Track expenses, fuel, reimbursements, fees and weekly settlement." />
          <ValueCard title="Feedback matters" text="Tell us about bugs, suggestions and confusing experiences directly from MileVoxa." />
        </div>
      </section>

      <section className="fp-pricing-faq" aria-labelledby="pricing-faq-title">
        <div className="fp-marketing-section-heading compact">
          <div>
            <span>Public Beta FAQ</span>
            <h2 id="pricing-faq-title">Before you join.</h2>
          </div>
          <p>Clear access terms for the current public beta phase.</p>
        </div>

        <div className="fp-pricing-faq-grid">
          <PricingFaq
            question="Is MileVoxa free right now?"
            answer="Yes. MileVoxa is free to use during the public beta for eligible users. This is a beta phase, not a promise that the product will remain free forever."
          />
          <PricingFaq
            question="Do I need a credit card?"
            answer="No. Joining the public beta does not require a payment card or checkout."
          />
          <PricingFaq
            question="What happens when the beta changes?"
            answer="Paid plans will be announced later. MileVoxa will give advance notice before free beta access changes."
          />
          <PricingFaq
            question="Will I be charged automatically when beta ends?"
            answer="No. Beta access does not automatically become a paid subscription. Choosing a future paid plan will require your explicit action."
          />
          <PricingFaq
            question="What happens to my existing data?"
            answer="Your MileVoxa account and business data remain associated with your account. Existing trial users receive the same beta access during this phase."
          />
        </div>
      </section>

      <section className="fp-marketing-final-cta">
        <div>
          <span>PUBLIC BETA</span>
          <h2>Put your trucking operation in one place and tell us what you think.</h2>
          <p>Free during beta. No credit card required.</p>
        </div>
        <div>
          <Link href="/signup" className="fp-marketing-button primary large">
            Join the Free Beta →
          </Link>
          <Link href="/" className="fp-marketing-button ghost large">Back to Home</Link>
        </div>
      </section>
    </PublicLayout>
  );
}

function PricingFaq({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="fp-pricing-faq-item">
      <summary>{question}<span>+</span></summary>
      <p>{answer}</p>
    </details>
  );
}

function ValueCard({ title, text }: { title: string; text: string }) {
  return <article><span>✓</span><h3>{title}</h3><p>{text}</p></article>;
}
