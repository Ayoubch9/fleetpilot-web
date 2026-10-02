const fs=require("fs");
const assert=require("assert");

const shell=fs.readFileSync("src/components/app-shell.tsx","utf8");
const mobile=fs.readFileSync("src/components/mobile-app-navigation.tsx","utf8");
const page=fs.readFileSync("src/app/odometer/page.tsx","utf8");
const manager=fs.readFileSync("src/app/odometer/odometer-manager.tsx","utf8");
const finance=fs.readFileSync("src/lib/week-finance.ts","utf8");

assert.ok(shell.includes('"odometer"'));
assert.ok(mobile.includes('"odometer"'));
assert.ok(page.includes('.from("weekly_odometer_records")'));
assert.ok(page.includes('.from("company_fee_settings")'));
assert.ok(page.includes('key={weekStart}'));
assert.ok(page.includes('.eq("week_start", weekStart)'));
assert.ok(manager.includes('.from("weekly_odometer_records")'));
assert.ok(manager.includes(".insert(payload)"));
assert.ok(manager.includes(".update(payload)"));
assert.ok(manager.includes("rowMiles * rowRate"));
assert.ok(manager.includes("rate_per_mile: Number(row.rate.toFixed(4))"));
assert.ok(manager.includes("setValues(initialState(trucks, records, mileageRate))"));
assert.ok(finance.includes("odometerMiles * mileageFeeRate"));

console.log("weekly-odometer checks passed");
