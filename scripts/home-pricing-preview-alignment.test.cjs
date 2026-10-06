const fs=require("fs");
const assert=require("assert");
const page=fs.readFileSync("src/app/page.tsx","utf8");
const pricing=fs.readFileSync("src/app/pricing/page.tsx","utf8");

assert.ok(page.includes("Free during beta. No credit card required."));
assert.ok(page.includes("Paid plans will be announced later"));
assert.ok(page.includes("Join the Free Beta"));
assert.ok(pricing.includes("PUBLIC BETA"));
assert.ok(pricing.includes("No credit card"));
assert.ok(pricing.includes("will not be charged automatically") || pricing.includes("does not automatically become a paid subscription"));
console.log("home-pricing-preview-alignment checks passed");
