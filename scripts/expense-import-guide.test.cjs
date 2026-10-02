const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/expenses/page.tsx","utf8");
const quick=fs.readFileSync("src/app/expenses/expense-quick-actions.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("trucks={trucks} loads={loads}"));
assert.ok(quick.includes("Download CSV Template"));
assert.ok(quick.includes("Choose CSV File"));
assert.ok(quick.includes("expense_date"));
assert.ok(quick.includes("truck_unit"));
assert.ok(quick.includes("load_number"));
assert.ok(quick.includes("fuel_price_per_gallon"));
assert.ok(quick.includes("YYYY-MM-DD"));
assert.ok(quick.includes("expenseRequiresLoad(category)"));
assert.ok(quick.includes("load_number"));
assert.ok(quick.includes("loadByNumber"));
assert.ok(quick.includes("truckByUnit"));
assert.ok(quick.includes("was not found in MileVoxa"));
assert.ok(quick.includes("milevoxa-expense-import-template.csv"));
assert.ok(css.includes("MileVoxa Expense Import Guide v4.3.43"));
assert.ok(css.includes(".fp-import-guide-card"));

console.log("expense-import-guide checks passed");
