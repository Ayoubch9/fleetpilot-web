const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/maintenance/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("maintenanceCostByTruck"));
assert.ok(page.includes("truckMaintenanceTotals"));
assert.ok(page.includes("<th>Cost</th>"));
assert.ok(page.includes("fp-maint-cost"));
assert.ok(page.includes("Maintenance Cost by Truck"));
assert.ok(page.includes("All recorded services"));
assert.ok(page.includes("Maintenance spend"));
assert.ok(page.includes("money(num(record.cost))"));
assert.ok(page.includes("money(total)"));

assert.ok(css.includes("MileVoxa Maintenance Truck Costs v4.3.46"));
assert.ok(css.includes(".fp-maint-truck-cost-row"));
assert.ok(css.includes(".fp-maint-cost"));

console.log("maintenance-truck-costs checks passed");
