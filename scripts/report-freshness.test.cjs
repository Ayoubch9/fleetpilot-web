const fs = require("fs");
const ts = require("typescript");
const vm = require("vm");
const assert = require("assert");

function load(path) {
  const source = fs.readFileSync(path, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const box = { exports: {} };
  vm.runInNewContext(js, {
    module: box,
    exports: box.exports,
    require,
    console,
    Date,
    Intl,
  });
  return box.exports;
}

const freshness = load("src/lib/report-freshness.ts");
const now = new Date(2026, 8, 20);

assert.strictEqual(
  freshness.reportFreshnessLabel("2026-09-18", now),
  "Live data",
  "records within the 7-day window may use Live data"
);

assert.strictEqual(
  freshness.reportFreshnessLabel("2026-08-01", now),
  "As of Aug 1, 2026",
  "stale report data must show an as-of date"
);

assert.strictEqual(
  freshness.reportFreshnessLabel(null, now),
  "No dated records"
);

assert.strictEqual(
  freshness.latestDatedValue([
    "2026-09-01",
    "2026-09-19",
    "2026-09-10",
  ]),
  "2026-09-19"
);

console.log("report-freshness checks passed");
