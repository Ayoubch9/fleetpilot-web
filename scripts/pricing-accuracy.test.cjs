const fs = require("fs");
const assert = require("assert");

const pricing = fs.readFileSync("src/app/pricing/page.tsx", "utf8");
const css = fs.readFileSync("src/app/globals.css", "utf8");

assert.ok(pricing.includes("Per company — not per truck."));
assert.ok(pricing.includes("$29/month per company"));
assert.ok(pricing.includes("The trial ends on day 15"));
assert.ok(pricing.includes("Paid billing starts only after"));
assert.ok(pricing.includes("does not currently publish a separate refund policy"));
assert.ok(pricing.includes("Stripe billing portal"));
assert.ok(pricing.includes("Does the price change with fleet size?"));
assert.ok(pricing.includes("checkout is still disabled in the current MileVoxa settings UI"));

assert.ok(css.includes(".mv-pricing-page .fp-pricing-popular"));
assert.ok(css.includes("background:#16853B!important"));
assert.ok(css.includes(".mv-pricing-page .fp-pricing-side-card>span"));
assert.ok(css.includes(".fp-pricing-faq-grid"));

console.log("pricing-accuracy checks passed");
