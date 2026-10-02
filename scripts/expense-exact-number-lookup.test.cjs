const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/expenses/page.tsx","utf8");

assert.ok(page.includes("isExactExpenseNumberLookup"));
assert.ok(page.includes("const matchedExpense = allExpenses.find"));
assert.ok(page.includes("filteredExpenses = matchedExpense ? [matchedExpense] : []"));
assert.ok(page.includes('isExactExpenseNumberLookup || categoryFilter === "all"'));

const lookupStart=page.indexOf("if (isExactExpenseNumberLookup)");
const elseStart=page.indexOf("} else {", lookupStart);
const truckFilterStart=page.indexOf('if (truckFilter !== "all")', elseStart);

assert.ok(lookupStart >= 0);
assert.ok(elseStart > lookupStart);
assert.ok(truckFilterStart > elseStart);

console.log("expense-exact-number-lookup checks passed");
