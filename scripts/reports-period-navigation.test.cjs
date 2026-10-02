const fs=require("fs");
const assert=require("assert");

const controls=fs.readFileSync(
  "src/app/reports/report-period-controls.tsx",
  "utf8"
);
const actions=fs.readFileSync(
  "src/app/reports/report-actions.tsx",
  "utf8"
);
const page=fs.readFileSync("src/app/reports/page.tsx","utf8");

assert.ok(controls.includes('["week", "month", "year"]'));
assert.ok(controls.includes("Previous ${activeStandardPeriod}"));
assert.ok(controls.includes("Next ${activeStandardPeriod}"));
assert.ok(controls.includes("direction * 7"));
assert.ok(controls.includes("date.setMonth(date.getMonth() + direction)"));
assert.ok(controls.includes("date.setFullYear(date.getFullYear() + direction)"));
assert.ok(controls.includes("Custom Date X → Date Y range"));

assert.ok(actions.includes("Choose any reporting range"));
assert.ok(actions.includes("11-day range"));
assert.ok(page.includes("Day-by-Day Business Activity"));
assert.ok(page.includes('"Day-by-Day"'));

console.log("reports-period-navigation checks passed");
