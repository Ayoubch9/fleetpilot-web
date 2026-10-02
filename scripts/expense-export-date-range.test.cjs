const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/expenses/page.tsx","utf8");
const quick=fs.readFileSync("src/app/expenses/expense-quick-actions.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("expenses={allExpenses}"));
assert.ok(quick.includes("openExportDialog"));
assert.ok(quick.includes("exportOpen"));
assert.ok(quick.includes("exportFrom"));
assert.ok(quick.includes("exportTo"));
assert.ok(quick.includes("From date *"));
assert.ok(quick.includes("To date *"));
assert.ok(quick.includes("date >= exportFrom && date <= exportTo"));
assert.ok(quick.includes("current page filters"));
assert.ok(quick.includes("For a single day, select the same date"));
assert.ok(quick.includes("No expenses were found between"));
assert.ok(css.includes("MileVoxa Expense Date Range Export v4.3.44"));
assert.ok(css.includes(".fp-expense-export-modal"));

console.log("expense-export-date-range checks passed");
