const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/reports/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("const completedLoads = allLoads.filter"));
assert.ok(page.includes("isCompletedLoadStatus(load.status, load.pickup_date, now)"));
assert.ok(page.includes("const completionDate = load.delivery_date || load.pickup_date"));
assert.ok(page.includes("inRange(completionDate, range.start, range.end)"));
assert.ok(page.includes("Delivered / completed in ${reportLabel}"));
assert.ok(css.includes("MileVoxa Reports Completed Loads Date Logic v4.3.59"));

console.log("reports-completed-loads-date-logic checks passed");
