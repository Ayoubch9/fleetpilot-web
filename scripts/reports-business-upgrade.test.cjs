const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/reports/page.tsx","utf8");
const actions=fs.readFileSync("src/app/reports/report-actions.tsx","utf8");
const periods=fs.readFileSync("src/app/reports/report-period-controls.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(periods.includes('"week", "month", "year"'));
assert.ok(page.includes("Fixed Expenses"));
assert.ok(page.includes("Company Revenue Fee"));
assert.ok(page.includes("Odometer Mileage Fee"));
assert.ok(page.includes("Reimbursements"));
assert.ok(page.includes("Fuel Cost"));
assert.ok(page.includes("Maintenance Activity"));
assert.ok(page.includes("Truck Performance"));
assert.ok(page.includes("weekly_fixed_expenses"));
assert.ok(page.includes("weekly_odometer_records"));
assert.ok(page.includes("company_fee_settings"));
assert.ok(page.includes("reimbursements"));
assert.ok(actions.includes("Run Custom Report"));
assert.ok(actions.includes("Schedule Report"));
assert.ok(actions.includes("Download Calendar Schedule"));
assert.ok(actions.includes("Automatic emailed reports are not enabled yet."));
assert.ok(css.includes("MileVoxa Reports Business Upgrade v4.3.55"));

console.log("reports-business-upgrade checks passed");
