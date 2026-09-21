const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

for(const text of [
  'className="mv-home-plan-check"',
  'className="mv-home-plan-price">$19/mo',
  'className="mv-home-plan-price">$29/mo',
  'className="mv-home-plan-price">$49/mo',
  'className="mv-home-plan-scope">1 truck',
  'Up to 5 trucks · unlimited drivers',
  'Up to 15 trucks',
]){
  assert.ok(page.includes(text),`missing ${text}`);
}

assert.ok(css.includes("MileVoxa Homepage Pricing Preview Alignment v4.3.17"));
assert.ok(css.includes("grid-template-columns:20px minmax(70px,.7fr) minmax(62px,.55fr) minmax(160px,1.55fr)!important"));
assert.ok(css.includes(".mv-home-pricing-plan-list li::before"));
assert.ok(css.includes("content:none!important"));
assert.ok(css.includes("background:#EAF6EC!important"));
assert.ok(css.includes("color:#16853B!important"));

console.log("home-pricing-preview-alignment checks passed");
