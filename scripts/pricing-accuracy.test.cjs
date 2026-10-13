const fs=require("fs");
const assert=require("assert");

const pricing=fs.readFileSync("src/app/pricing/page.tsx","utf8");
const plans=fs.readFileSync("src/app/pricing/pricing-plans.tsx","utf8");
const combined=(pricing+"\n"+plans).toLowerCase();

for(const text of [
  "public beta",
  "no credit card required",
  "join the free beta",
]){
  assert.ok(combined.includes(text),`missing ${text}`);
}

assert.ok(
  combined.includes("paid plans will be announced later") ||
  combined.includes("paid plans will be introduced later"),
  "missing future paid-plan disclosure"
);

assert.ok(
  combined.includes("will not be charged automatically") ||
  combined.includes("cannot be billed automatically") ||
  combined.includes("never be auto-charged"),
  "missing no-automatic-charge disclosure"
);

assert.ok(
  combined.includes("explicit action") ||
  combined.includes("choose to do so explicitly"),
  "missing explicit opt-in disclosure"
);

for(const stale of [
  "14-day free trial",
  "first 100 companies",
  "MOST POPULAR",
]){
  assert.ok(!pricing.includes(stale),`stale pricing copy: ${stale}`);
}

console.log("pricing-accuracy checks passed");
