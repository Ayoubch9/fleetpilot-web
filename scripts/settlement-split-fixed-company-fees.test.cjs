const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/settlement/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(!page.includes('label="Fixed + Company Fees"'));
assert.ok(page.includes('label="Fixed Expenses"'));
assert.ok(page.includes('value={money(fixedTotal)}'));
assert.ok(page.includes('active weekly fixed'));
assert.ok(page.includes('label="Company Fees"'));
assert.ok(page.includes('value={money(revenueFee + mileageFee)}'));
assert.ok(page.includes('revenue fee'));
assert.ok(page.includes('mileage fee'));

assert.ok(css.includes("MileVoxa Settlement Fixed / Company Fees Split v4.3.52"));

console.log("settlement-split-fixed-company-fees checks passed");
