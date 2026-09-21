const fs=require("fs");
const assert=require("assert");

const pricing=fs.readFileSync("src/app/pricing/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");
const layout=fs.readFileSync("src/components/public-layout.tsx","utf8");
const header=fs.readFileSync("src/components/public-header.tsx","utf8");

for(const text of [
  "Simple MileVoxa pricing",
  "THE TRIAL",
  "What you get",
  "WHY ONE PLAN?",
  "Start without a card",
  "14-DAY FREE TRIAL",
]){
  assert.ok(pricing.toLowerCase().includes(text.toLowerCase()), `missing ${text}`);
}

assert.ok(css.includes(".mv-pricing-page .fp-pricing-hero>span"));
assert.ok(css.includes(".mv-pricing-page .fp-pricing-side-card>span"));
assert.ok(css.includes(".mv-pricing-page .fp-marketing-section-heading>div>span"));
assert.ok(css.includes(".mv-pricing-page .fp-marketing-final-cta>div>span"));
assert.ok(css.includes("color:#16853B!important"));
assert.ok(css.includes(".mv-pricing-page .fp-pricing-popular"));
assert.ok(css.includes("background:#16853B!important"));

assert.ok(css.includes(".mv-pricing-page .fp-marketing-button.primary"));
assert.ok(css.includes("linear-gradient(180deg,#16853B 0%,#126F32 100%)"));
assert.ok(css.includes("border-radius:10px!important"));

assert.ok(css.includes(".mv-pricing-page .fp-marketing-button.secondary,"));
assert.ok(css.includes(".mv-pricing-page .fp-marketing-button.ghost"));
assert.ok(css.includes("border:1px solid #102238!important"));
assert.ok(css.includes("background:#fff!important"));

assert.ok(pricing.includes("<PublicLayout"));
assert.ok(layout.includes("<PublicHeader />"));
assert.ok(layout.includes("<PublicFooter />"));
assert.ok(header.includes('href="/#features">Features'));
assert.ok(header.includes('href="/tools">Free Tools'));
assert.ok(header.includes('href="/pricing">Pricing'));
assert.ok(header.includes('href="/#about">About'));

console.log("pricing-visual-contract checks passed");
