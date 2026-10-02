const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/expenses/page.tsx","utf8");
const filters=fs.readFileSync("src/app/expenses/expense-filters.tsx","utf8");

assert.ok(page.includes("expenseNumberById = new Map"));
assert.ok(page.includes("expenseNumberQuery"));
assert.ok(page.includes("requestedExpenseNumber"));
assert.ok(page.includes("isExactExpenseNumberLookup"));
assert.ok(page.includes("displayNumber === requestedExpenseNumber"));
assert.ok(page.includes('`#${String(displayNumber).padStart(4, "0")}`'));
assert.ok(page.includes('expenseNumberById.get(expense.id) || 0'));
assert.ok(
  !page.includes('(page - 1) * PAGE_SIZE + index + 1'),
  "expense display number must not be page-relative"
);
assert.ok(filters.includes("Search #0001, description, vendor, category, truck..."));

console.log("expense-number-search checks passed");
