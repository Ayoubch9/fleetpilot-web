const fs=require("fs");
const assert=require("assert");

const shell=fs.readFileSync("src/components/app-shell.tsx","utf8");
const expenses=fs.readFileSync("src/app/expenses/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(shell.includes("showWeekSelector"));
assert.ok(shell.includes('"expenses"'));
assert.ok(shell.includes("{showWeekSelector && ("));
assert.ok(shell.includes("fp-mobile-control-zone-search-only"));
assert.ok(shell.includes("<GlobalSearch />"));

assert.ok(expenses.includes("<ExpenseFilters trucks={trucks} />"));
assert.ok(expenses.includes("dateFrom"));
assert.ok(expenses.includes("dateTo"));

assert.ok(css.includes(".fp-mobile-control-zone.fp-mobile-control-zone-search-only"));

console.log("expenses-hide-global-week-selector checks passed");
