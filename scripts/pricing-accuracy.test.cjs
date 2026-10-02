const fs=require("fs");
const assert=require("assert");
const pricing=fs.readFileSync("src/app/pricing/page.tsx","utf8");
const plans=fs.readFileSync("src/app/pricing/pricing-plans.tsx","utf8");
for(const text of [
  "free public beta",
  "No credit card required",
  "Paid plans will be announced later",
  "will not be charged automatically",
  "explicit action",
]) assert.ok((pricing+plans).toLowerCase().includes(text.toLowerCase()),`missing ${text}`);
for(const stale of ["14-day free trial","first 100 companies","MOST POPULAR"]){
  assert.ok(!pricing.includes(stale),`stale pricing copy: ${stale}`);
}
console.log("pricing-accuracy checks passed");
