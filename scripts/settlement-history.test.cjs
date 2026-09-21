const fs = require("fs");
const ts = require("typescript");
const vm = require("vm");
const assert = require("assert");

const week = {
  parseDate(value) {
    if (!value) return null;
    const [y,m,d] = value.slice(0,10).split("-").map(Number);
    return new Date(y,m-1,d);
  },
  monday(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return d;
  },
  dbDate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth()+1).padStart(2,"0"),
      String(date.getDate()).padStart(2,"0"),
    ].join("-");
  },
  weekEnd(start) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    d.setDate(d.getDate()+6);
    return d;
  },
};

const finance = {
  calculateWeekFinance(ledger) {
    const revenue = ledger.loads.reduce((s,r)=>s+Number(r.rate||0),0);
    const variable = ledger.expenses.reduce((s,r)=>s+Number(r.amount||0),0);
    const fixed = ledger.fixedExpenses.reduce((s,r)=>s+Number(r.amount||0),0);
    const reimb = ledger.reimbursements.reduce((s,r)=>s+Number(r.amount||0),0);
    const expenses = variable + fixed - reimb;
    const miles = ledger.loads.reduce(
      (s,r)=>s+Number(r.loaded_miles||0)+Number(r.deadhead_miles||0),0
    );
    const netProfit = revenue-expenses;
    return {
      grossRevenue: revenue,
      totalExpenses: expenses,
      netProfit,
      totalMiles: miles,
      profitMargin: revenue > 0 ? netProfit/revenue*100 : null,
    };
  },
};

const source = fs.readFileSync("src/lib/settlement-history.ts","utf8");
const js = ts.transpileModule(source,{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},
}).outputText;
const box={exports:{}};
vm.runInNewContext(js,{
  module:box,
  exports:box.exports,
  require(id){
    if(id==="@/lib/fleetpilot-week") return week;
    if(id==="@/lib/week-finance") return finance;
    return require(id);
  },
  console,
  Date,
  Intl,
  Set,
});
const domain=box.exports;

const rows=domain.buildSettlementHistory({
  loads:[
    {pickup_date:"2026-09-14",rate:2000,loaded_miles:1000,deadhead_miles:100},
    {pickup_date:"2026-09-07",rate:1000,loaded_miles:500,deadhead_miles:0},
  ],
  expenses:[
    {expense_date:"2026-09-15",amount:300},
    {expense_date:"2026-09-08",amount:200},
  ],
  reimbursements:[],
  fixedExpenses:[{amount:100}],
  odometers:[],
});

assert.strictEqual(rows.length,2);
assert.strictEqual(rows[0].weekStart,"2026-09-14");
assert.strictEqual(rows[0].revenue,2000);
assert.strictEqual(rows[0].expenses,400);
assert.strictEqual(rows[0].netProfit,1600);
assert.strictEqual(rows[0].miles,1100);
assert.ok(
  rows[0].citation.startsWith("Based on your MileVoxa settlements"),
  "weekly metric must carry a settlement citation"
);

console.log("settlement-history checks passed");
