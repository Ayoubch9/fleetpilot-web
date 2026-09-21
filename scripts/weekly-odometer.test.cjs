const fs=require("fs");
const assert=require("assert");

const shell=fs.readFileSync("src/components/app-shell.tsx","utf8");
const mobile=fs.readFileSync("src/components/mobile-app-navigation.tsx","utf8");
const page=fs.readFileSync("src/app/odometer/page.tsx","utf8");
const manager=fs.readFileSync("src/app/odometer/odometer-manager.tsx","utf8");
const finance=fs.readFileSync("src/lib/week-finance.ts","utf8");

assert.ok(shell.includes('"odometer"'));
assert.ok(shell.includes('["odometer", "Weekly Odometer", "/odometer", "odometer"]'));
assert.ok(mobile.includes('["odometer", "Weekly Odometer", "/odometer", "odometer"]'));

assert.ok(page.includes('.from("weekly_odometer_records")'));
assert.ok(page.includes('.from("company_fee_settings")'));
assert.ok(page.includes('active="odometer"'));

assert.ok(manager.includes('.from("weekly_odometer_records")'));
assert.ok(manager.includes(".insert(payload)"));
assert.ok(manager.includes(".update(payload)"));
assert.ok(manager.includes("end < row.start"));
assert.ok(manager.includes("miles * mileageRate"));
assert.ok(manager.includes("Save Weekly Odometer"));

assert.ok(finance.includes("? 0.15"));
assert.ok(finance.includes("odometerMiles * mileageFeeRate"));

console.log("weekly-odometer checks passed");
