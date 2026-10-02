const fs=require("fs");
const assert=require("assert");

const policy=fs.readFileSync("src/lib/expense-load-link.ts","utf8");
const add=fs.readFileSync("src/app/expenses/add-expense-form.tsx","utf8");
const edit=fs.readFileSync("src/app/expenses/expense-actions.tsx","utf8");
const quick=fs.readFileSync("src/app/dashboard/dashboard-quick-actions.tsx","utf8");
const dashboard=fs.readFileSync("src/app/dashboard/page.tsx","utf8");
const ledger=fs.readFileSync("src/lib/week-ledger.ts","utf8");
const odoPage=fs.readFileSync("src/app/odometer/page.tsx","utf8");
const odo=fs.readFileSync("src/app/odometer/odometer-manager.tsx","utf8");

assert.ok(policy.includes("expenseRequiresLoad"));
assert.ok(policy.includes("keeps load profit accurate"));
assert.ok(add.includes("expenseRequiresLoad(category) && !loadId"));
assert.ok(add.includes("required={expenseRequiresLoad(category)}"));
assert.ok(edit.includes("expenseRequiresLoad(category)&&!loadId"));
assert.ok(quick.includes("Truck, Load ID, date, and fuel total are required"));
assert.ok(quick.includes("<LoadField"));
assert.ok(dashboard.includes("loads={quickActionLoads}"));
assert.ok(ledger.includes("loadsResult"));

assert.ok(odoPage.includes("key={weekStart}"));
assert.ok(odoPage.includes('.eq("week_start", weekStart)'));
assert.ok(odo.includes("useEffect(() =>"));
assert.ok(odo.includes("setValues(initialState(trucks, records, mileageRate))"));
assert.ok(odo.includes("[weekStart, trucks, records, mileageRate]"));
assert.ok(odo.includes("record?.ratePerMile"));
assert.ok(odo.includes("rowMiles * rowRate"));
assert.ok(odo.includes("rate_per_mile: Number(row.rate.toFixed(4))"));
assert.ok(odo.includes('.eq("week_start", weekStart)'));
assert.ok(odo.includes("Saved Week Rate"));

console.log("expense-load-link-odometer-weekly checks passed");
