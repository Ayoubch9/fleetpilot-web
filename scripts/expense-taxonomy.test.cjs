const fs = require("fs");
const ts = require("typescript");
const vm = require("vm");
const assert = require("assert");

function transpile(path, requireMap = {}) {
  const source = fs.readFileSync(path, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const moduleBox = { exports: {} };
  const localRequire = (id) => {
    if (id in requireMap) return requireMap[id];
    return require(id);
  };
  vm.runInNewContext(js, {
    module: moduleBox,
    exports: moduleBox.exports,
    require: localRequire,
    console,
    Map,
    Set,
  });
  return moduleBox.exports;
}

const taxonomy = transpile("src/lib/expense-taxonomy.ts", {
  "@/lib/chart-palette": {
    CHART_PALETTE: {
      navy: "#102238",
      green: "#16853B",
      red: "#DC2626",
      amber: "#EA580C",
      gray: "#64748B",
      purple: "#7C3AED",
    },
  },
});

assert.strictEqual(taxonomy.expenseCategoryKey("Fuel"), "fuel");
assert.strictEqual(taxonomy.expenseCategoryKey("Tolls"), "tolls");
assert.strictEqual(taxonomy.expenseCategoryKey("Bobtail Insurance"), "insurance");
assert.strictEqual(taxonomy.expenseCategoryKey("Office"), "other");

const summary = taxonomy.summarizeExpenseCategories(
  [
    { category: "Tolls", amount: 347.84 },
    { category: "Office", amount: 1158 },
  ],
  (row) => row.category,
  (row) => row.amount
);

const totals = Object.fromEntries(summary.map((row) => [row.label, row.amount]));
assert.strictEqual(totals.Tolls, 347.84);
assert.strictEqual(totals.Other, 1158);
assert.strictEqual(
  totals.Other + totals.Tolls,
  1505.84,
  "Tolls must not be silently folded into Other"
);

console.log("expense-taxonomy checks passed");
