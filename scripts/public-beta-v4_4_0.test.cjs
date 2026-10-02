const fs=require("fs");
const assert=require("assert");
const read=(p)=>fs.readFileSync(p,"utf8");

const home=read("src/app/page.tsx");
const pricing=read("src/app/pricing/page.tsx");
const plans=read("src/app/pricing/pricing-plans.tsx");
const signup=read("src/app/signup/page.tsx");
const shell=read("src/components/app-shell.tsx");
const beta=read("src/lib/beta-access.ts");
const checkout=read("src/app/api/billing/checkout/route.ts");
const feedback=read("src/app/api/feedback/route.ts");
const migration=read("supabase_public_beta_feedback_v4_4_0.sql");
const settings=read("src/app/settings/settings-center.tsx");

for(const text of [
  "Your trucking business,",
  "Join the Free Beta",
  "Free during beta. No credit card required.",
  "Paid plans will be announced later",
]) assert.ok(home.includes(text),`home missing ${text}`);

assert.ok(pricing.includes("Free access while we build MileVoxa with truckers."));
assert.ok(pricing.includes("will not be charged automatically"));
assert.ok(plans.includes("$0<span>during beta</span>"));
assert.ok(plans.includes("futurePaidPlanConfiguration"));
assert.ok(signup.includes("Free public beta · No card required"));
assert.ok(shell.includes("Public Beta"));
assert.ok(shell.includes("Send Feedback"));
assert.ok(beta.includes('PUBLIC_BETA_ENV = "MILEVOXA_PUBLIC_BETA"'));
assert.ok(beta.includes("allowed: true"));
assert.ok(checkout.includes("Paid checkout is disabled"));
assert.ok(feedback.includes('.from("beta_feedback").insert'));
assert.ok(migration.includes("enable row level security"));
assert.ok(migration.includes("grant insert on table public.beta_feedback to authenticated"));
assert.ok(migration.includes("revoke select, update, delete"));
assert.ok(settings.includes("Free Beta Access"));
assert.ok(settings.includes("No automatic paid enrollment"));

for(const stale of ["14 DAYS FREE","Start 14-Day Free Trial","Start Free Trial"]){
  assert.ok(!home.includes(stale),`stale home copy: ${stale}`);
  assert.ok(!pricing.includes(stale),`stale pricing copy: ${stale}`);
}

console.log("public-beta-v4.4.0 checks passed");
