const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/trucks/page.tsx","utf8");
const quick=fs.readFileSync("src/app/trucks/trucks-quick-actions.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("trucks={allTrucks}"));
assert.ok(quick.includes("Download CSV Template"));
assert.ok(quick.includes("Choose CSV File"));
assert.ok(quick.includes("unit_number"));
assert.ok(quick.includes("registration_expiry"));
assert.ok(quick.includes("insurance_expiry"));
assert.ok(quick.includes("milevoxa-truck-import-template.csv"));
assert.ok(quick.includes("already exists in MileVoxa"));
assert.ok(quick.includes("duplicated in this CSV"));
assert.ok(quick.includes("year must be a 4-digit year"));
assert.ok(quick.includes("must use YYYY-MM-DD"));
assert.ok(quick.includes("All Statuses"));
assert.ok(quick.includes("All Makes"));
assert.ok(quick.includes("Mileage range"));
assert.ok(quick.includes("Registration expiry"));
assert.ok(quick.includes("Insurance expiry"));
assert.ok(quick.includes("No trucks match the selected export filters."));
assert.ok(quick.includes("TRUCK_HEADERS"));
assert.ok(css.includes("MileVoxa Trucks Import + Export Data Model v4.3.54"));
assert.ok(css.includes(".fp-truck-export-modal"));
assert.ok(css.includes(".fp-truck-import-guide-card"));

console.log("trucks-import-export-model checks passed");
