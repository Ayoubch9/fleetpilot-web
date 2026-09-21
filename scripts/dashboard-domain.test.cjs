const fs = require("fs");
const ts = require("typescript");
const vm = require("vm");
const assert = require("assert");

const source = fs.readFileSync("src/lib/week-finance.ts", "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

const moduleBox = { exports: {} };
const expenseTaxonomy = {
  expenseCategoryLabel(category) {
    const key = String(category || "Other").trim().toLowerCase();
    if (key.includes("fuel")) return "Fuel";
    if (
      key.includes("maintenance") ||
      key.includes("repair") ||
      key.includes("service") ||
      key.includes("tire") ||
      key.includes("brake")
    ) return "Maintenance";
    if (key.includes("toll")) return "Tolls";
    if (key.includes("insurance") || key.includes("bobtail")) return "Insurance";
    return "Other";
  },
};

vm.runInNewContext(js, {
  module: moduleBox,
  exports: moduleBox.exports,
  require(id) {
    if (id === "@/lib/expense-taxonomy") return expenseTaxonomy;
    return require(id);
  },
  console,
});
const domain = moduleBox.exports;

const emptyLedger = {
  loads: [],
  expenses: [],
  reimbursements: [],
  fixedExpenses: [],
  odometers: [],
  maintenance: [],
};

assert.deepStrictEqual(
  Array.from(domain.buildWeekActivity(emptyLedger)),
  [],
  "activity feed must be empty when no real ledger events exist"
);

assert.strictEqual(
  domain.calculateTrend(0, 100).tone,
  "negative",
  "zero current value must never have a green/positive trend"
);

assert.strictEqual(
  domain.calculateTrend(-1622, -1312).tone,
  "negative",
  "negative current profit must never have a green/positive trend"
);

assert.strictEqual(
  domain.calculateWeekFinance(emptyLedger).profitMargin,
  null,
  "profit margin must be n/a/null when gross revenue is zero"
);


assert.strictEqual(
  domain.calculateTrend(0, 0),
  null,
  "trend must be hidden when the previous value is zero/non-comparable"
);

const realActivity = domain.buildWeekActivity({
  ...emptyLedger,
  expenses: [
    {
      id: "e1",
      category: "Fuel",
      vendor: "Real Vendor",
      amount: 123.45,
      expense_date: "2026-09-18",
    },
  ],
});
assert.strictEqual(realActivity.length, 1);
assert.strictEqual(realActivity[0].text, "Fuel purchase · Real Vendor");
assert.strictEqual(realActivity[0].amount, -123.45);

const fixedLedger = {
  ...emptyLedger,
  fixedExpenses: [
    { name: "Bobtail Insurance", amount: 150, is_active: true },
    { name: "IFTA", amount: 35, is_active: true },
    { name: "Insurance", amount: 375, is_active: true },
    { name: "OAI", amount: 37, is_active: true },
    { name: "Office", amount: 75, is_active: true },
    { name: "Truck Rent", amount: 950, is_active: true },
  ],
  settings: {
    is_revenue_fee_active: false,
    is_mileage_fee_active: false,
  },
};

const breakdown = Object.fromEntries(
  domain.buildExpenseBreakdown(fixedLedger).map((row) => [row.label, row.value])
);
assert.strictEqual(breakdown.Insurance, 525);
assert.strictEqual(breakdown["Truck Payment"], 950);
assert.strictEqual(breakdown.Other, 147);

console.log("dashboard-domain checks passed");
