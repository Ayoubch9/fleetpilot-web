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
    const [y,m,d] = value.slice(0,10).split("-").map(Number);
    return new Date(y,m-1,d);
  },
  monday(date) {
    const d = new Date(date.getFullYear(),date.getMonth(),date.getDate());
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return d;
  },
  dbDate(date) {
    const y=date.getFullYear();
    const m=String(date.getMonth()+1).padStart(2,"0");
    const d=String(date.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}`;
  },
  weekEnd(date) {
    const d = new Date(date);
    d.setDate(d.getDate()+6);
    return d;
  },
};

const taxonomy = {
  expenseCategoryLabel(value) {
    const key=String(value||"").trim().toLowerCase();
    if(key.includes("fuel")) return "Fuel";
    if(key.includes("maintenance")) return "Maintenance";
    if(key.includes("toll")) return "Tolls";
    if(key.includes("insurance")) return "Insurance";
    return "Other";
  },
};

const pilot = transpileModule("src/lib/pilot-data.ts", {
  "@/lib/fleetpilot-week": weekHelpers,
  "@/lib/expense-taxonomy": taxonomy,
});

const snapshots = pilot.buildPilotWeeklySnapshots({
  loads: [
    {
      truck_id: "t1",
      pickup_date: "2026-09-14",
      rate: 3000,
      loaded_miles: 900,
      deadhead_miles: 100,
    },
    {
      truck_id: "t2",
      pickup_date: "2026-09-16",
      rate: 2500,
      loaded_miles: 700,
      deadhead_miles: 50,
    },
  ],
  expenses: [
    {
      truck_id: "t1",
      category: "Fuel",
      expense_date: "2026-09-15",
      amount: 420,
      gallons: 120,
      vendor: "Fuel Stop A",
    },
    {
      truck_id: "t2",
      category: "Fuel",
      expense_date: "2026-09-17",
      amount: 360,
      gallons: 100,
      vendor: "Fuel Stop B",
    },
    {
      truck_id: "t1",
      category: "Tolls",
      expense_date: "2026-09-17",
      amount: 80,
    },
  ],
  reimbursements: [
    { reimbursement_date: "2026-09-18", amount: 50 },
  ],
  odometers: [
    {
      truck_id: "t1",
      week_start: "2026-09-14",
      start_odometer: 100000,
      end_odometer: 102000,
      rate_per_mile: 0.15,
    },
  ],
  maintenance: [
    {
      truck_id: "t1",
      service_date: "2026-09-18",
      service_type: "Oil change",
      cost: 250,
    },
  ],
  trucks: [
    { id: "t1", unit_number: "101" },
    { id: "t2", unit_number: "202" },
  ],
  defaultMileageRate: 0.15,
});

assert.strictEqual(snapshots.length,1);
const week=snapshots[0];
assert.strictEqual(week.weekStart,"2026-09-14");
assert.strictEqual(week.weekEnd,"2026-09-20");
assert.strictEqual(week.fuel.gallons,220);
assert.strictEqual(week.fuel.spend,780);
assert.strictEqual(week.fuel.purchases,2);
assert.ok(Math.abs(week.fuel.averagePricePerGallon - (780/220)) < 0.00001);
assert.strictEqual(week.fuel.byTruck[0].truck,"101");
assert.strictEqual(week.fuel.byTruck[0].gallons,120);
assert.strictEqual(week.expenses.variableTotal,860);
assert.strictEqual(week.reimbursements,50);
assert.strictEqual(week.odometer.miles,2000);
assert.strictEqual(week.odometer.mileageExpense,300);
assert.strictEqual(week.maintenance.cost,250);
assert.strictEqual(week.loads.revenue,5500);
assert.strictEqual(week.loads.totalMiles,1750);

const coverage=pilot.buildPilotDataCoverage({
  loads:[{pickup_date:"2026-09-14"},{pickup_date:"2026-09-21"}],
  expenses:[{expense_date:"2026-09-15"}],
  reimbursements:[],
  odometers:[{week_start:"2026-09-14"}],
  maintenance:[{service_date:"2026-09-18"}],
});
assert.strictEqual(coverage.loads.first,"2026-09-14");
assert.strictEqual(coverage.loads.latest,"2026-09-21");
assert.strictEqual(coverage.expenses.records,1);

const route=fs.readFileSync("src/app/api/pilot/ask/route.ts","utf8");
for(const required of [
  "weeklyOperations",
  "recentFuelPurchases",
  "recentExpenseRecords",
  "dataCoverage",
  "sourceStatus",
  "context.time",
  "fuel consumed",
  "average fuel price",
  "Based on your MileVoxa data",
]){
  assert.ok(route.includes(required),`missing route contract: ${required}`);
}

const page=fs.readFileSync("src/app/pilot-ai/page.tsx","utf8");
assert.ok(page.includes("How many gallons of fuel did I use last week?"));
assert.ok(page.includes("Fuel recorded:"));

console.log("pilot-data-depth checks passed");
