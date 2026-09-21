"use client";

import Link from "next/link";
import { useState } from "react";

type BillingCycle = "monthly" | "yearly";

type PricingPlan = {
  name: string;
  monthly: number;
  yearly: number;
  scope: string;
  description: string;
  features: readonly string[];
  popular?: boolean;
};

const plans: readonly PricingPlan[] = [
  {
    name: "Solo",
    monthly: 19,
    yearly: 190,
    scope: "1 truck",
    description: "For an owner-operator running one truck.",
    features: [
      "Loads",
      "Expenses",
      "Fuel tracking",
      "Real profit per load",
      "Weekly settlement",
      "Document storage",
    ],
  },
  {
    name: "Fleet",
    monthly: 29,
    yearly: 290,
    scope: "Up to 5 trucks · Unlimited drivers",
    description: "For growing small fleets that need operations and team visibility.",
    popular: true,
    features: [
      "Everything in Solo",
      "Maintenance tracking & reminders",
      "Pilot AI",
      "Team & driver records",
    ],
  },
  {
    name: "Pro",
    monthly: 49,
    yearly: 490,
    scope: "Up to 15 trucks",
    description: "For established fleets that need deeper reporting and support.",
    features: [
      "Everything in Fleet",
      "Advanced profit reports",
      "Priority support",
    ],
  },
] as const;

export default function PricingPlans() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <section className="mv-launch-pricing" aria-label="MileVoxa plans">
      <div className="mv-pricing-toggle" role="group" aria-label="Billing cycle">
        <button
          type="button"
          className={cycle === "monthly" ? "active" : ""}
          aria-pressed={cycle === "monthly"}
          onClick={() => setCycle("monthly")}
        >
          Monthly
        </button>
        <button
          type="button"
          className={cycle === "yearly" ? "active" : ""}
          aria-pressed={cycle === "yearly"}
          onClick={() => setCycle("yearly")}
        >
          Yearly <span>2 months free</span>
        </button>
      </div>

      <div className="mv-pricing-plan-grid">
        {plans.map((plan) => {
          const price = cycle === "monthly" ? plan.monthly : plan.yearly;
          const period = cycle === "monthly" ? "/month" : "/year";

          return (
            <article
              key={plan.name}
              className={`fp-pricing-card mv-pricing-plan-card ${
                plan.popular ? "popular" : ""
              }`}
            >
              {plan.popular && (
                <div className="fp-pricing-popular">MOST POPULAR</div>
              )}

              <div className="mv-pricing-plan-head">
                <span>{plan.name}</span>
                <h2>
                  ${price}
                  <span>{period}</span>
                </h2>
                <p className="fp-pricing-scope">{plan.scope}</p>
                <p>{plan.description}</p>
              </div>

              <div className="fp-pricing-included">
                <span>Included:</span>
                <div>
                  {plan.features.map((feature) => (
                    <p key={feature}>
                      <i>✓</i>
                      {feature}
                    </p>
                  ))}
                </div>
              </div>

              <Link
                href="/signup"
                className="fp-marketing-button primary pricing"
              >
                Start 14-Day Free Trial <span>→</span>
              </Link>

              <small>No credit card required.</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}
