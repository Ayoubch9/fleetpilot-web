const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/page.tsx","utf8");

for(const text of [
  "ILLUSTRATIVE EXAMPLE",
  "Owner-operator workflow",
  "Growing fleet workflow",
  "Established fleet workflow",
  'value="14 days"',
  'value="3 plans"',
  'value="15 trucks"',
  'value="Unlimited"',
  "No credit card required",
  "Solo · Fleet · Pro",
  "No per-driver charge",
]){
  assert.ok(page.includes(text),`missing ${text}`);
}

for(const text of [
  "TODO PLACEHOLDER",
  "TODO — Owner-operator customer",
  "TODO — Small-fleet customer",
  "TODO — Fleet owner customer",
  'value="TODO"',
  "replace with verified aggregate",
]){
  assert.ok(!page.includes(text),`placeholder remains: ${text}`);
}

assert.ok(page.includes("They are product scenarios, not customer testimonials."));

console.log("home-marketing-proof checks passed");
