const fs=require("fs");
const assert=require("assert");

const pricing=fs.readFileSync("src/app/pricing/page.tsx","utf8");
const plans=fs.readFileSync("src/app/pricing/pricing-plans.tsx","utf8");

assert.ok(plans.startsWith('"use client";'));
assert.ok(plans.includes('useState<BillingCycle>("monthly")'));
assert.ok(plans.includes('cycle === "monthly" ? plan.monthly : plan.yearly'));
assert.ok(plans.includes('href="/signup"'));

assert.ok(!pricing.includes("MileVoxa Pro is $29/month per company"));
assert.ok(!pricing.includes("WHY ONE PLAN?"));
assert.ok(!pricing.includes("THE TRIAL"));

for(const color of ["#4f88ef","#4c87eb","#3b83da"]){
  assert.ok(!plans.toLowerCase().includes(color), `blue accent in pricing plans: ${color}`);
}

console.log("launch-pricing-content checks passed");
