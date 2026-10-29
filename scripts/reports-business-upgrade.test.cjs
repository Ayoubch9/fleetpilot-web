const fs=require("fs");
const assert=require("assert");
const vm=require("vm");
const ts=require("typescript");

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
assert.ok(page.includes("getActiveReportWorkWeeks"));
assert.ok(page.includes("weeklyFixed * activeWorkWeeks"));
assert.ok(page.includes("activeWorkWeekKeys.has(weekKey)"));
assert.ok(page.includes('load.status === "CANCELLED" || load.status === "EXPIRED"'));
assert.ok(page.includes("Weekly fixed expenses are included only for weeks with a valid load that is not cancelled or expired."));
assert.ok(page.includes('row.fixed.toFixed(2)'));
assert.ok(page.includes("weekly_odometer_records"));
assert.ok(page.includes("company_fee_settings"));
assert.ok(page.includes("reimbursements"));
assert.ok(actions.includes("Run Custom Report"));
assert.ok(actions.includes("Schedule Report"));
assert.ok(actions.includes("Download Calendar Schedule"));
assert.ok(actions.includes("Automatic emailed reports are not enabled yet."));
assert.ok(css.includes("MileVoxa Reports Business Upgrade v4.3.55"));

const activeWeeksSource=fs.readFileSync("src/lib/report-week-fixed-expenses.ts","utf8");
const activeWeeksJs=ts.transpileModule(activeWeeksSource,{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
}).outputText;
const activeWeeksModule={exports:{}};
vm.runInNewContext(activeWeeksJs,{module:activeWeeksModule,exports:activeWeeksModule.exports});
const activeWeeks=activeWeeksModule.exports.getActiveReportWorkWeeks;
assert.deepStrictEqual(
  Array.from(activeWeeks(
    ["2026-10-05","2026-10-12","2026-10-19"],
    ["2026-10-05","2026-10-05",null,"2026-10-26","2026-10-19"]
  )).sort(),
  ["2026-10-05","2026-10-19"],
  "charge weekly fixed costs once for each report week containing a load"
);
assert.strictEqual(activeWeeks(["2026-10-05"],[null]).size,0,"no loads means no weekly fixed cost");

console.log("reports-business-upgrade checks passed");
