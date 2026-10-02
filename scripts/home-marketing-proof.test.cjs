const fs=require("fs");
const assert=require("assert");
const page=fs.readFileSync("src/app/page.tsx","utf8");
for(const text of [
  "ILLUSTRATIVE EXAMPLE",
  "Owner-operator workflow",
  "Growing fleet workflow",
  "Established fleet workflow",
  'value="Free"',
  'label="Public beta access"',
  "No credit card required",
  "They are product scenarios, not customer testimonials.",
]) assert.ok(page.includes(text),`missing ${text}`);
for(const text of ["TODO PLACEHOLDER",'value="TODO"',"14 DAYS FREE"]){
  assert.ok(!page.includes(text),`stale/placeholder remains: ${text}`);
}
console.log("home-marketing-proof checks passed");
