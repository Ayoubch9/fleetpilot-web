const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/maintenance/page.tsx","utf8");
const quick=fs.readFileSync("src/app/maintenance/maintenance-quick-actions.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("trucks={allTrucks}"));
assert.ok(quick.includes("Download CSV Template"));
assert.ok(quick.includes("Choose CSV File"));
assert.ok(quick.includes("truck_unit"));
assert.ok(quick.includes("service_type"));
assert.ok(quick.includes("service_date"));
assert.ok(quick.includes("next_service_mileage"));
assert.ok(quick.includes("next_service_date"));
assert.ok(quick.includes("milevoxa-maintenance-import-template.csv"));
assert.ok(quick.includes("truckByUnit"));
assert.ok(quick.includes("was not found in MileVoxa"));
assert.ok(quick.includes("service_date must use YYYY-MM-DD"));
assert.ok(quick.includes("cost > 0"));
assert.ok(quick.includes('.from("expenses")'));
assert.ok(quick.includes('category: "Maintenance"'));
assert.ok(quick.includes("expense_id: expenseId"));
assert.ok(quick.includes("createdMaintenanceIds"));
assert.ok(quick.includes("createdExpenseIds"));
assert.ok(quick.includes("keeps Expenses,"));
assert.ok(css.includes("MileVoxa Maintenance Import Guide v4.3.47"));
assert.ok(css.includes(".fp-maint-import-guide-card"));

console.log("maintenance-import-guide checks passed");
