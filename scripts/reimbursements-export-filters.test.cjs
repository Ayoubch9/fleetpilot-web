const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/reimbursements/page.tsx","utf8");
const quick=fs.readFileSync("src/app/reimbursements/reimbursement-quick-actions.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("rows={reimbursements.map"));
assert.ok(page.includes('export_kind: isStandalone(row)'));
assert.ok(quick.includes("openExportDialog"));
assert.ok(quick.includes("exportFrom"));
assert.ok(quick.includes("exportTo"));
assert.ok(quick.includes("exportKind"));
assert.ok(quick.includes("exportTruck"));
assert.ok(quick.includes("exportCategory"));
assert.ok(quick.includes("exportMinAmount"));
assert.ok(quick.includes("exportMaxAmount"));
assert.ok(quick.includes("All Types"));
assert.ok(quick.includes("Full Recovery"));
assert.ok(quick.includes("Partial Recovery"));
assert.ok(quick.includes("Standalone"));
assert.ok(quick.includes("All Trucks"));
assert.ok(quick.includes("All Categories"));
assert.ok(quick.includes("matchesKind"));
assert.ok(quick.includes("matchesTruck"));
assert.ok(quick.includes("matchesCategory"));
assert.ok(quick.includes("matchesMin"));
assert.ok(quick.includes("matchesMax"));
assert.ok(quick.includes("Linked Expense Number"));
assert.ok(quick.includes("Recovery Type"));
assert.ok(quick.includes("No reimbursements match the selected export filters."));
assert.ok(css.includes("MileVoxa Reimbursements Export Filters v4.3.50"));
assert.ok(css.includes(".fp-reimb-export-modal"));

console.log("reimbursements-export-filters checks passed");
