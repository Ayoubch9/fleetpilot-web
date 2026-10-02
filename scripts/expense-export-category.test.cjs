const fs=require("fs");
const assert=require("assert");
const quick=fs.readFileSync("src/app/expenses/expense-quick-actions.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(quick.includes('exportCategory, setExportCategory'));
assert.ok(quick.includes("All Categories"));
assert.ok(quick.includes('<option value="Fuel">Fuel</option>'));
assert.ok(quick.includes('<option value="Maintenance">Maintenance</option>'));
assert.ok(quick.includes("categoryMatches"));
assert.ok(quick.includes("categorySuffix"));
assert.ok(quick.includes("The current page filters"));
assert.ok(css.includes(".fp-expense-export-category"));

console.log("expense-export-category checks passed");
