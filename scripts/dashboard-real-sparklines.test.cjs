const fs=require("fs");
const assert=require("assert");

const dashboard=fs.readFileSync("src/app/dashboard/page.tsx","utf8");
const ledger=fs.readFileSync("src/lib/week-ledger.ts","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(ledger.includes("fetchDashboardTrendHistory"));
assert.ok(ledger.includes("calculateWeekFinance"));
assert.ok(ledger.includes("safeWeeks"));
assert.ok(dashboard.includes("fetchDashboardTrendHistory(supabase, selectedWeekStart, 8)"));
assert.ok(dashboard.includes("netProfitSeries"));
assert.ok(dashboard.includes("grossRevenueSeries"));
assert.ok(dashboard.includes("totalExpensesSeries"));
assert.ok(dashboard.includes("profitMarginSeries"));
assert.ok(dashboard.includes("series={netProfitSeries}"));
assert.ok(dashboard.includes("series={grossRevenueSeries}"));
assert.ok(dashboard.includes("series={totalExpensesSeries}"));
assert.ok(dashboard.includes("series={profitMarginSeries}"));
assert.ok(dashboard.includes("preserveAspectRatio=\"none\""));
assert.ok(dashboard.includes("aria-label={`${label} trend over the last ${usable.length} weeks`}"));
assert.ok(!dashboard.includes("data: [28,24,26,20,23,16,19,13,15,10,7]"));
assert.ok(css.includes("MileVoxa Dashboard KPI Real Sparklines v4.3.31"));
assert.ok(css.includes("max-width:112px!important"));
assert.ok(css.includes("overflow:hidden!important"));

console.log("dashboard-real-sparklines checks passed");
