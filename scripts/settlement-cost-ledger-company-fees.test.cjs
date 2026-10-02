const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/settlement/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("const companyFeeCostRows: CostRow[]"));
assert.ok(page.includes('category: "Company Fee"'));
assert.ok(page.includes('category: "Odometer Fee"'));
assert.ok(page.includes("amount: revenueFee"));
assert.ok(page.includes("amount: mileageFee"));
assert.ok(page.includes("revenue fee on weekly gross revenue"));
assert.ok(page.includes("odometer miles ×"));
assert.ok(page.includes("...companyFeeCostRows"));
assert.ok(page.includes("revenueFee > 0"));
assert.ok(page.includes("mileageFee > 0"));
assert.ok(css.includes("MileVoxa Settlement Cost Ledger Company Fees v4.3.53"));

console.log("settlement-cost-ledger-company-fees checks passed");
