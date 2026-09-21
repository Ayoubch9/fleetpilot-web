const fs = require("fs");
const ts = require("typescript");
const vm = require("vm");
const assert = require("assert");

function transpileModule(path, requireMap = {}) {
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
    Date,
    Intl,
    Set,
    Map,
  });
  return moduleBox.exports;
}

const weekHelpers = {
  parseDate(value) {
    if (!value) return null;
    const [y, m, d] = value.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
  },
  monday(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return d;
  },
  dbDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  },
};

const domain = transpileModule("src/lib/load-domain.ts", {
  "@/lib/fleetpilot-week": weekHelpers,
});

assert.strictEqual(
  domain.normalizeUsLocation("ATLANTA, ga").value,
  "Atlanta, GA",
  "location casing should normalize"
);

assert.strictEqual(
  domain.normalizeUsLocation("Katy, fo").ok,
  false,
  "invalid state codes must be rejected"
);

assert.strictEqual(
  domain.validateLoadMiles(0, 0).ok,
  false,
  "0-mile loads must be rejected"
);

const rounded = domain.validateLoadMiles(123.6, 10.4);
assert.strictEqual(rounded.ok, true);
assert.strictEqual(rounded.loadedMiles, 124);
assert.strictEqual(rounded.deadheadMiles, 10);

assert.strictEqual(
  domain.effectiveLoadStatus(
    "UPCOMING",
    "2026-07-01",
    new Date(2026, 8, 20)
  ),
  "EXPIRED",
  "past-dated UPCOMING loads must become terminal EXPIRED"
);

const profitMap = domain.calculateLoadProfitabilityMap({
  loads: [
    {
      id: "a",
      rate: 1000,
      loaded_miles: 100,
      deadhead_miles: 0,
      pickup_date: "2026-09-14",
    },
    {
      id: "b",
      rate: 2000,
      loaded_miles: 300,
      deadhead_miles: 0,
      pickup_date: "2026-09-15",
    },
  ],
  expenses: [
    {
      load_id: "a",
      amount: 50,
      category: "Fuel",
      expense_date: "2026-09-14",
    },
  ],
  fixedExpenses: [{ amount: 400, is_active: true }],
});

assert.strictEqual(profitMap.get("a").profit, 850);
assert.strictEqual(profitMap.get("b").profit, 1700);
assert.notStrictEqual(
  profitMap.get("a").profit,
  1000,
  "profit must never silently duplicate rate"
);


const noCostMap = domain.calculateLoadProfitabilityMap({
  loads: [
    {
      id: "only",
      rate: 7500,
      loaded_miles: 1200,
      pickup_date: "2026-09-14",
    },
  ],
  expenses: [],
  fixedExpenses: [],
});
assert.strictEqual(
  noCostMap.get("only").profit,
  null,
  "profit must be unavailable rather than silently equal to rate when no costs are allocatable"
);

const incompleteMap = domain.calculateLoadProfitabilityMap({
  loads: [
    {
      id: "a",
      rate: 1000,
      loaded_miles: 100,
      pickup_date: "2026-09-14",
    },
  ],
  expenses: [
    {
      load_id: null,
      amount: 50,
      category: "Tolls",
      expense_date: "2026-09-14",
    },
  ],
  fixedExpenses: [{ amount: 100, is_active: true }],
});

assert.strictEqual(
  incompleteMap.get("a").profit,
  null,
  "unallocatable fuel/toll costs must show unavailable profit"
);

const alerts = transpileModule("src/lib/fleetpilot-alerts.ts", {
  "@/lib/load-domain": domain,
});

const deduped = alerts.dedupeMileVoxaAlerts([
  {
    id: "a",
    category: "loads",
    severity: "info",
    title: "Load #010668 pickup approaching",
    description: "ATLANTA, GA → Dallas, TX is scheduled.",
    href: "/loads",
    dateLabel: "Sep 20, 2026",
    sortDate: "2026-09-20T00:00:00.000Z",
  },
  {
    id: "b",
    category: "loads",
    severity: "info",
    title: "load #010668 PICKUP approaching",
    description: "atlanta, ga → DALLAS, TX is scheduled.",
    href: "/loads",
    dateLabel: "Sep 20, 2026",
    sortDate: "2026-09-20T00:00:00.000Z",
  },
]);

assert.strictEqual(
  deduped.length,
  1,
  "duplicate load alerts should collapse regardless of capitalization"
);

console.log("load-domain checks passed");
