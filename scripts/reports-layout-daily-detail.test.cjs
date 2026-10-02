const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/reports/page.tsx","utf8");
const actions=fs.readFileSync("src/app/reports/report-actions.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("const dailyRows = reportDates.map"));
assert.ok(page.includes("Day-by-Day Business Activity"));
assert.ok(page.includes("calendarDays(range.start, range.end)"));
assert.ok(page.includes("weekBookingDate"));
assert.ok(page.includes("odometerFeeByWeek"));
assert.ok(page.includes("CSV export includes every row below"));
assert.ok(page.includes('"Day-by-Day"'));
assert.ok(page.includes("row.fixed.toFixed(2)"));
assert.ok(page.includes("row.odometerFee.toFixed(2)"));
assert.ok(page.includes("fp-report-meta-strip"));
assert.ok(page.includes("fp-report-content-stack"));
assert.ok(!page.includes("<h2>Quick Actions</h2>"));
assert.strictEqual((page.match(/<ReportActions/g)||[]).length,1);

assert.ok(actions.includes("fp-report-header-actions"));
assert.ok(actions.includes("Custom Report"));
assert.ok(actions.includes("Schedule Report"));
assert.ok(actions.includes("11-day range"));
assert.ok(css.includes("MileVoxa Reports Alignment + Daily Detail v4.3.56"));
assert.ok(css.includes(".fp-report-daily-table"));
assert.ok(css.includes(".fp-report-header-actions"));

console.log("reports-layout-daily-detail checks passed");
