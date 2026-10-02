const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/expenses/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("fp-expenses-scope-note"));
assert.ok(page.includes("Odometer mileage fees"));
assert.ok(page.includes("Weekly Fixed Expenses"));
assert.ok(page.includes("not included here"));
assert.ok(page.includes("Weekly Settlement"));

assert.ok(css.includes("MileVoxa Expenses Scope Note v4.3.41"));
assert.ok(css.includes(".fp-expenses-scope-note"));
assert.ok(css.includes("background:#F4FAF5"));

console.log("expenses-scope-note checks passed");
