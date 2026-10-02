const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/reimbursements/page.tsx","utf8");
const quick=fs.readFileSync("src/app/reimbursements/reimbursement-quick-actions.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("expenses={expenses} trucks={trucks}"));
assert.ok(!page.includes(".limit(300)"));
assert.ok(quick.includes("Download CSV Template"));
assert.ok(quick.includes("Choose CSV File"));
assert.ok(quick.includes("reimbursement_date"));
assert.ok(quick.includes("amount"));
assert.ok(quick.includes("category"));
assert.ok(quick.includes("truck_unit"));
assert.ok(quick.includes("expense_number"));
assert.ok(quick.includes("reference"));
assert.ok(quick.includes("notes"));
assert.ok(quick.includes("milevoxa-reimbursement-import-template.csv"));
assert.ok(quick.includes("expenseNumber - 1"));
assert.ok(quick.includes("was not found in MileVoxa"));
assert.ok(quick.includes("reimbursement_date must use YYYY-MM-DD"));
assert.ok(quick.includes("amount must be a number greater than zero"));
assert.ok(quick.includes("expense?.truck_id"));
assert.ok(quick.includes("expense?.category"));
assert.ok(css.includes("MileVoxa Reimbursements Import Guide v4.3.49"));
assert.ok(css.includes(".fp-reimb-import-guide-card"));

console.log("reimbursements-import-guide checks passed");
