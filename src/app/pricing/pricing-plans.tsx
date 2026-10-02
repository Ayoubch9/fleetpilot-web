import Link from "next/link";

// Kept for future paid-plan work. These values are intentionally not rendered
// during public beta and are not a current offer.
export const futurePaidPlanConfiguration = [
  { name: "Solo", monthly: 19, yearly: 190, scope: "1 truck" },
  { name: "Fleet", monthly: 29, yearly: 290, scope: "Up to 5 trucks" },
  { name: "Pro", monthly: 49, yearly: 490, scope: "Up to 15 trucks" },
] as const;

const availableFeatures = [
  "Loads and truck management",
  "Expenses and reimbursements",
  "Weekly settlements",
  "Fuel analytics",
  "Maintenance tracking",
  "Reports and exports",
  "Document management",
  "Pilot AI using your MileVoxa data",
] as const;

export default function PricingPlans() {
  return (
    <section className="mv-launch-pricing mv-beta-pricing" aria-label="MileVoxa public beta access">
      <article className="fp-pricing-card mv-beta-pricing-card">
        <div className="fp-pricing-popular">PUBLIC BETA</div>
        <div className="mv-pricing-plan-head">
          <span>Free Beta Access</span>
          <h2>$0<span>during beta</span></h2>
          <p className="fp-pricing-scope">No credit card required</p>
          <p>
            Use MileVoxa while the product is in public beta, share honest feedback,
            and help us improve the trucking workflow and user experience.
          </p>
        </div>

        <div className="fp-pricing-included">
          <span>Available during beta:</span>
          <div>
            {availableFeatures.map((feature) => (
              <p key={feature}><i>✓</i>{feature}</p>
            ))}
          </div>
        </div>

        <Link href="/signup" className="fp-marketing-button primary pricing">
          Join the Free Beta <span>→</span>
        </Link>

        <small>
          Paid plans will be announced later. Beta users will not be charged
          automatically; choosing a future paid plan will require explicit action.
        </small>
      </article>
    </section>
  );
}
