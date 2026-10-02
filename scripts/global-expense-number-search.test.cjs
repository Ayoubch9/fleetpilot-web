const fs=require("fs");
const assert=require("assert");

const search=fs.readFileSync("src/components/global-search.tsx","utf8");

assert.ok(search.includes("expenseNumberMatch"));
assert.ok(search.includes("requestedExpenseNumber"));
assert.ok(search.includes("expenseSearchQuery"));
assert.ok(search.includes(".range("));
assert.ok(search.includes("requestedExpenseNumber - 1"));
assert.ok(search.includes('`#${String(requestedExpenseNumber).padStart(4, "0")}`'));
assert.ok(search.includes('/expenses?q=${encodeURIComponent(displayExpenseNumber || q)}'));
assert.ok(search.includes("Try #0001"));

console.log("global-expense-number-search checks passed");
