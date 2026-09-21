const fs = require("fs");
const assert = require("assert");

const home = fs.readFileSync("src/app/page.tsx", "utf8");

assert.ok(home.includes('href="/tools"'));
assert.ok(home.includes("See how it works"));
assert.ok(!home.includes("Open Web App"));

assert.ok(
  home.includes("the same MileVoxa account and company data"),
  "FAQ must not expose Supabase implementation jargon"
);
assert.ok(!home.includes("Supabase company data"));

assert.ok(home.includes("$29/month per company, not per truck"));
assert.ok(home.includes("there is no automatic charge"));
assert.ok(home.includes("Stripe billing portal"));

assert.ok(home.includes("TODO PLACEHOLDER"));
assert.ok(home.includes('value="TODO"'));
assert.ok(home.includes("14 DAYS FREE"));
assert.ok(home.includes("No card required to start"));

assert.ok(home.includes("pexels-photo-27099095.jpeg"));
assert.ok(!home.includes("DRIVE SMARTER."));
assert.ok(!home.includes("EARN MORE."));

console.log("homepage-conversion checks passed");
