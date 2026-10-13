const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/page.tsx","utf8");
const pricing=fs.readFileSync("src/app/pricing/page.tsx","utf8");

assert.ok(page.includes("Join the Free Beta"));
assert.ok(page.includes("Paid plans will be announced later"));
assert.ok(page.includes('href="/pricing">Pricing &amp; Beta'));

assert.ok(
  page.includes("Free during beta · No credit card required · Web + mobile account") ||
  page.includes("Free during beta. No credit card required.") ||
  (
    page.includes("Free during beta") &&
    page.includes("No credit card required")
  ),
  "homepage must clearly state free beta access and no credit card requirement"
);

assert.ok(pricing.includes("Public Beta"));
assert.ok(pricing.includes("No credit card"));
assert.ok(
  pricing.includes("cannot be billed automatically") ||
  pricing.includes("You will never be auto-charged")
);

console.log("home-pricing-preview-alignment checks passed");
