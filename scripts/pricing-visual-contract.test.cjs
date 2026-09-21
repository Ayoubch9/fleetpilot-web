const fs=require("fs");
const assert=require("assert");

const pricing=fs.readFileSync("src/app/pricing/page.tsx","utf8");
const plans=fs.readFileSync("src/app/pricing/pricing-plans.tsx","utf8");
const home=fs.readFileSync("src/app/page.tsx","utf8");
const signup=fs.readFileSync("src/app/signup/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");
const layout=fs.readFileSync("src/components/public-layout.tsx","utf8");
const header=fs.readFileSync("src/components/public-header.tsx","utf8");

for(const text of [
  "Pricing that doesn&apos;t punish you for growing.",
  "One flat price per company — not per truck, not per driver.",
  "Founding member offer: the first 100 companies lock the Fleet plan at",
  "What you get",
  "Start without a card",
]){
  assert.ok(pricing.includes(text), `missing ${text}`);
}

for(const text of [
  'name: "Solo"',
  "monthly: 19",
  "yearly: 190",
  'name: "Fleet"',
  "monthly: 29",
  "yearly: 290",
  'name: "Pro"',
  "monthly: 49",
  "yearly: 490",
  "MOST POPULAR",
  "2 months free",
  "Unlimited drivers",
  "Real profit per load",
  "Maintenance tracking & reminders",
  "Pilot AI",
  "Team & driver records",
  "Advanced profit reports",
  "Priority support",
]){
  assert.ok(plans.includes(text), `missing ${text}`);
}

assert.ok(pricing.includes("14-day free trial"));
assert.ok(pricing.includes("No credit card required"));
assert.ok(pricing.includes("Pricing is per company, not per truck."));
assert.ok(pricing.includes("Fleet and Pro include unlimited drivers."));
assert.ok(pricing.includes("manage or cancel it through the Stripe billing portal"));
assert.ok(pricing.includes("MileVoxa does not currently publish a separate refund policy"));

assert.ok(home.includes("Solo is $19/month"));
assert.ok(home.includes("Fleet is $29/month"));
assert.ok(home.includes("Pro is $49/month"));
assert.ok(home.includes("Starts at $19/month"));
assert.ok(signup.includes("Plans from $19/month per company."));

assert.ok(css.includes(".mv-founder-offer{"));
assert.ok(css.includes(".mv-pricing-toggle{"));
assert.ok(css.includes(".mv-pricing-plan-grid{"));
assert.ok(css.includes("background:linear-gradient(180deg,#16853B 0%,#126F32 100%)"));
assert.ok(css.includes("background:#F7F9F8!important"));
assert.ok(css.includes("color:#102238"));
assert.ok(css.includes("color:#0B1730"));

assert.ok(pricing.includes("<PublicLayout"));
assert.ok(layout.includes("<PublicHeader />"));
assert.ok(layout.includes("<PublicFooter />"));
assert.ok(header.includes('href="/#features">Features'));
assert.ok(header.includes('href="/tools">Free Tools'));
assert.ok(header.includes('href="/pricing">Pricing'));
assert.ok(header.includes('href="/#about">About'));

console.log("pricing-visual-contract checks passed");
