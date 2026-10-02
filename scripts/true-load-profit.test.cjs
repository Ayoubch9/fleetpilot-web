const fs=require("fs");
const ts=require("typescript");
const vm=require("vm");
const assert=require("assert");

function transpileModule(path, requireMap={}) {
  const source=fs.readFileSync(path,"utf8");
  const js=ts.transpileModule(source,{
    compilerOptions:{
      module:ts.ModuleKind.CommonJS,
      target:ts.ScriptTarget.ES2020,
      esModuleInterop:true,
    },
  }).outputText;

  const moduleBox={exports:{}};
  const localRequire=(id)=>{
    if(id in requireMap)return requireMap[id];
    return require(id);
  };

  vm.runInNewContext(js,{
    module:moduleBox,
    exports:moduleBox.exports,
    require:localRequire,
    console,
    Date,
    Intl,
    Set,
    Map,
  });

  return moduleBox.exports;
}

const weekHelpers={
  parseDate(value){
    if(!value)return null;
    const [y,m,d]=value.slice(0,10).split("-").map(Number);
    return new Date(y,m-1,d);
  },
  monday(date){
    const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());
    const day=d.getDay();
    d.setDate(d.getDate()-(day===0?6:day-1));
    return d;
  },
  dbDate(date){
    const y=date.getFullYear();
    const m=String(date.getMonth()+1).padStart(2,"0");
    const d=String(date.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}`;
  },
};

const domain=transpileModule("src/lib/load-domain.ts",{
  "@/lib/fleetpilot-week":weekHelpers,
});

const map=domain.calculateLoadProfitabilityMap({
  loads:[
    {
      id:"a",
      rate:1000,
      loaded_miles:100,
      deadhead_miles:0,
      pickup_date:"2026-09-14",
    },
    {
      id:"b",
      rate:2000,
      loaded_miles:300,
      deadhead_miles:0,
      pickup_date:"2026-09-15",
    },
  ],
  expenses:[
    {
      load_id:null,
      amount:400,
      category:"Fuel",
      expense_date:"2026-09-14",
    },
  ],
  fixedExpenses:[{amount:400,is_active:true}],
  feeSettings:{
    revenue_fee_percent:15,
    mileage_fee_per_mile:0.15,
    is_revenue_fee_active:true,
    is_mileage_fee_active:true,
  },
  odometers:[
    {
      week_start:"2026-09-14",
      start_odometer:100000,
      end_odometer:100800,
    },
  ],
});

const a=map.get("a");
const b=map.get("b");

assert.strictEqual(a.allocatedSharedFuelAndTolls,100);
assert.strictEqual(a.allocatedFixed,100);
assert.strictEqual(a.allocatedRevenueFee,150);
assert.strictEqual(a.allocatedMileageFee,30);
assert.strictEqual(a.profit,620);

assert.strictEqual(b.allocatedSharedFuelAndTolls,300);
assert.strictEqual(b.allocatedFixed,300);
assert.strictEqual(b.allocatedRevenueFee,300);
assert.strictEqual(b.allocatedMileageFee,90);
assert.strictEqual(b.profit,1010);

// Company weekly economics (without reimbursements):
// 3000 revenue - 400 fuel - 400 fixed - 450 revenue fee - 120 mileage fee.
assert.strictEqual(a.profit+b.profit,1630);

const disabledFees=domain.calculateLoadProfitabilityMap({
  loads:[{
    id:"only",
    rate:1000,
    loaded_miles:100,
    pickup_date:"2026-09-14",
  }],
  expenses:[],
  fixedExpenses:[],
  feeSettings:{
    revenue_fee_percent:15,
    mileage_fee_per_mile:0.15,
    is_revenue_fee_active:false,
    is_mileage_fee_active:false,
  },
  odometers:[],
});

assert.strictEqual(disabledFees.get("only").profit,1000);
assert.strictEqual(disabledFees.get("only").allocatedRevenueFee,0);
assert.strictEqual(disabledFees.get("only").allocatedMileageFee,0);

const domainSource=fs.readFileSync("src/lib/load-domain.ts","utf8");
const loadsPage=fs.readFileSync("src/app/loads/page.tsx","utf8");
const detailPage=fs.readFileSync("src/app/loads/[id]/page.tsx","utf8");

assert.ok(domainSource.includes("allocatedRevenueFee"));
assert.ok(domainSource.includes("allocatedMileageFee"));
assert.ok(domainSource.includes("odometerMilesByWeek"));
assert.ok(domainSource.includes("rate * (revenueFeePercent / 100)"));
assert.ok(loadsPage.includes('.from("company_fee_settings")'));
assert.ok(loadsPage.includes('.from("weekly_odometer_records")'));
assert.ok(detailPage.includes("Revenue Fee"));
assert.ok(detailPage.includes("Odometer Mileage Fee"));
assert.ok(detailPage.includes('label="Load Profit"'));
assert.ok(detailPage.includes("weekly odometer mileage fee"));
assert.ok(loadsPage.includes('<h1 className="fp-loads-title">Loads</h1>'));

console.log("true-load-profit checks passed");
