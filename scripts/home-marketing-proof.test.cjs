const fs=require("fs");
const assert=require("assert");
const page=fs.readFileSync("src/app/page.tsx","utf8");

for(const text of [
  "Your truck can gross $8,000 this week.",
  "That doesn&apos;t mean you made $8,000.",
  "Gary, IN ➔ Dallas, TX",
  "WHAT THE TRUCK ACTUALLY MADE:",
  "No spreadsheets. No guesswork.",
  "Know what needs your attention today.",
  "Ask questions about your own trucking operation.",
  "Public Beta",
  "No credit card",
]){
  assert.ok(page.includes(text),`missing ${text}`);
}

for(const removed of [
  "Gross revenue is only the beginning.",
  "WEEKLY OPERATING SUMMARY · UNIT 01",
  "Not ready to create an account yet?",
  "LOW-FRICTION CALCULATORS",
  "No fake promises. Just better visibility into your trucking business.",
  "Before you take the load, run the numbers.",
  "Your business doesn&apos;t stay behind a desk.",
]){
  assert.ok(!page.includes(removed),`removed homepage section returned: ${removed}`);
}

for(const stale of ["TODO PLACEHOLDER",'value="TODO"',"14 DAYS FREE","fake testimonial"]){
  assert.ok(!page.includes(stale),`stale/placeholder remains: ${stale}`);
}

console.log("home-marketing-proof checks passed");
