const fs=require("fs");
const assert=require("assert");

const controls=fs.readFileSync(
  "src/app/reports/report-period-controls.tsx",
  "utf8"
);
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(controls.includes('["week", "month", "year"]'));
assert.ok(controls.includes("Previous ${activeStandardPeriod}"));
assert.ok(controls.includes("Next ${activeStandardPeriod}"));
assert.ok(controls.includes("REPORTING PERIOD"));
assert.ok(controls.includes("Custom Date X → Date Y range"));

assert.ok(!controls.includes("Select Month"));
assert.ok(!controls.includes("Select Year"));
assert.ok(!controls.includes("Select Any Date"));
assert.ok(!controls.includes('type="month"'));
assert.ok(!controls.includes('type="date"'));
assert.ok(!controls.includes('type="number"'));

assert.ok(css.includes("MileVoxa Reports Simplified Period Controls v4.3.58"));
assert.ok(css.includes(".fp-report-period-shell-v3"));

console.log("reports-simplified-period-controls checks passed");
