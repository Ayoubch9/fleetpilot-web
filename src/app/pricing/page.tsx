import type { Metadata } from "next";
import PublicLayout from "@/components/public-layout";
import Link from "next/link";
import { publicPageMetadata } from "@/lib/seo";


export const metadata: Metadata = publicPageMetadata({
  title: "Pricing | MileVoxa - $29/mo per Company",
  description:
    "MileVoxa Pro is $29/month per company after a 14-day free trial, with no card required to start and no per-truck pricing.",
  path: "/pricing",
});

const included = [
  "Dashboard & weekly performance",
  "Loads, trucks and expenses",
  "Fuel analytics",
  "Maintenance tracking",
  "Reimbursements",
  "Weekly settlement",
  "Reports & data export",
  "Documents & expiration alerts",
  "Pilot AI",
  "Operational notifications",
  "Web + mobile account",
];

export default function PricingPage() {
  return (
    <PublicLayout mainClassName="mv-pricing-page fp-marketing fp-pricing-page min-h-screen bg-[#f7f9fc] text-[#0b1730]">
      

      <section className="fp-pricing-hero">
        <span>Simple MileVoxa pricing</span>
        <h1>Start with the product.<br />Decide with your own numbers.</h1>
        <p>
          Every new MileVoxa account starts with a 14-day free trial. No card is
          required to test the workflow with your own loads, costs and fleet data.
        </p>
      </section>

      <section className="fp-pricing-layout">
        <article className="fp-pricing-card">
          <div className="fp-pricing-popular">14-DAY FREE TRIAL</div>
          <div className="fp-pricing-card-head">
            <div>
              <span>MileVoxa Pro</span>
              <h2>$29<span>/month</span></h2>
              <p className="fp-pricing-scope">Per company — not per truck.</p>
              <p>Current published MileVoxa Pro price after the free trial.</p>
            </div>
            <div className="fp-pricing-trial-badge">
              <strong>$0 today</strong>
              <span>No card required</span>
            </div>
          </div>

          <div className="fp-pricing-included">
            <span>Everything you need to run the operation:</span>
            <div>
              {included.map((item) => (
                <p key={item}><i>✓</i>{item}</p>
              ))}
            </div>
          </div>

          <Link href="/signup" className="fp-marketing-button primary pricing">
            Start 14-Day Free Trial <span>→</span>
          </Link>
          <small>
            No card is required for the trial and there is no automatic charge on
            day 15. Stripe checkout exists in the billing backend, but paid checkout
            is still disabled in the current MileVoxa settings UI pending billing/legal
            activation. A paid subscription starts only after the company owner
            actively completes checkout once it is enabled.
          </small>
        </article>

        <aside className="fp-pricing-side">
          <div className="fp-pricing-side-card">
            <span>THE TRIAL</span>
            <h3>Use MileVoxa like a real operating week.</h3>
            <ol>
              <li><b>01</b><div><strong>Add your trucks</strong><span>Set up the fleet you actually run.</span></div></li>
              <li><b>02</b><div><strong>Track real loads</strong><span>Use manual entry or Telegram load import.</span></div></li>
              <li><b>03</b><div><strong>Add fuel & expenses</strong><span>Build the true cost picture.</span></div></li>
              <li><b>04</b><div><strong>Review the week</strong><span>See settlement, profit and cost per mile together.</span></div></li>
            </ol>
          </div>

          <div className="fp-pricing-side-card dark">
            <span>WHY ONE PLAN?</span>
            <h3>No feature maze.</h3>
            <p>
              MileVoxa is built as one connected operating system. Loads are more
              useful when expenses, maintenance, fuel and settlement live beside them,
              so the core product stays together.
            </p>
          </div>
        </aside>
      </section>

      <section className="fp-pricing-compare">
        <div className="fp-marketing-section-heading compact">
          <div>
            <span>What you get</span>
            <h2>More than a load tracker.</h2>
          </div>
          <p>
            MileVoxa is meant to replace the disconnected process around the load—not
            just store load numbers.
          </p>
        </div>

        <div className="fp-pricing-value-grid">
          <ValueCard title="Operations" text="Loads, trucks, documents and maintenance stay connected." />
          <ValueCard title="Financial clarity" text="Expenses, fuel, reimbursements, fees and settlement show the real weekly result." />
          <ValueCard title="Decision support" text="Reports, alerts, comparisons and Pilot AI help turn operating history into action." />
        </div>
      </section>

      <section className="fp-pricing-faq" aria-labelledby="pricing-faq-title">
        <div className="fp-marketing-section-heading compact">
          <div>
            <span>Pricing FAQ</span>
            <h2 id="pricing-faq-title">Before you subscribe.</h2>
          </div>
          <p>
            The answers below reflect the current MileVoxa billing implementation
            and published pricing.
          </p>
        </div>

        <div className="fp-pricing-faq-grid">
          <PricingFaq
            question="What happens after the 14-day trial?"
            answer="The trial ends on day 15. Because no card is required to start, MileVoxa does not automatically charge you when the trial ends. Your company data remains tied to your account while you decide whether to subscribe."
          />
          <PricingFaq
            question="When does paid billing start?"
            answer="Paid billing starts only after the company owner actively completes Stripe checkout. The billing backend is implemented, but checkout is still disabled in the current MileVoxa settings UI pending billing/legal activation, so no paid subscription starts automatically today."
          />
          <PricingFaq
            question="What is the refund policy?"
            answer="MileVoxa does not currently publish a separate refund policy because paid checkout is not yet enabled in the product UI. Any applicable refund or purchase terms will be presented before a paid purchase is completed. Until checkout is enabled and completed, there is no subscription charge to refund."
          />
          <PricingFaq
            question="How do I cancel?"
            answer="Once paid billing is enabled and you have an active subscription, the company owner can manage or cancel it through the Stripe billing portal. There is nothing to cancel during the no-card free trial."
          />
          <PricingFaq
            question="Does the price change with fleet size?"
            answer="The current MileVoxa Pro price is $29/month per company, not per truck. The current Stripe checkout creates one subscription for the company, so adding trucks does not create a separate per-truck charge in the current billing model."
          />
        </div>
      </section>

      <section className="fp-marketing-final-cta">
        <div>
          <span>Start without a card</span>
          <h2>Give MileVoxa one real week of your data.</h2>
          <p>You will know quickly whether having the operation in one place changes the way you run it.</p>
        </div>
        <div>
          <Link href="/signup" className="fp-marketing-button primary large">Start Free Trial →</Link>
          <Link href="/" className="fp-marketing-button ghost large">Back to Home</Link>
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
  return <article><span>✓</span><h3>{title}</h3><p>{text}</p></article>;
}

