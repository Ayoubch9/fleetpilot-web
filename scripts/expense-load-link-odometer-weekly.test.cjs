const fs=require("fs");
const assert=require("assert");

const policy=fs.readFileSync("src/lib/expense-load-link.ts","utf8");
const add=fs.readFileSync("src/app/expenses/add-expense-form.tsx","utf8");
const edit=fs.readFileSync("src/app/expenses/expense-actions.tsx","utf8");
const quick=fs.readFileSync("src/app/dashboard/dashboard-quick-actions.tsx","utf8");
const dashboard=fs.readFileSync("src/app/dashboard/page.tsx","utf8");
const ledger=fs.readFileSync("src/lib/week-ledger.ts","utf8");
const odoPage=fs.readFileSync("src/app/odometer/page.tsx","utf8");
const odo=fs.readFileSync("src/app/odometer/odometer-manager.tsx","utf8");

assert.ok(policy.includes("expenseRequiresLoad"));
assert.ok(policy.includes("keeps load profit accurate"));
assert.ok(add.includes("expenseRequiresLoad(category) && !loadId"));
assert.ok(add.includes("required={expenseRequiresLoad(category)}"));
assert.ok(edit.includes("expenseRequiresLoad(category)&&!loadId"));
assert.ok(quick.includes("Truck, Load ID, date, and fuel total are required"));
assert.ok(quick.includes("<LoadField"));
assert.ok(dashboard.includes("loads={quickActionLoads}"));
assert.ok(ledger.includes("loadsResult"));

assert.ok(odoPage.includes("key={weekStart}"));
assert.ok(odoPage.includes('.eq("week_start", weekStart)'));
assert.ok(odo.includes("previousInputs.weekStart !== weekStart"));
assert.ok(odo.includes("setValues(initialState(trucks, records, mileageRate))"));
assert.ok(odo.includes("previousInputs.trucks !== trucks"));
assert.ok(odo.includes("previousInputs.records !== records"));
assert.ok(odo.includes("previousInputs.mileageRate !== mileageRate"));
assert.ok(odo.includes("record?.ratePerMile"));
assert.ok(odo.includes("rowMiles * rowRate"));
assert.ok(odo.includes("rate_per_mile: Number(row.rate.toFixed(4))"));
assert.ok(odo.includes('.eq("week_start", weekStart)'));
assert.ok(odo.includes("Saved Week Rate"));


// Execute the component with a small hook harness: server refreshes must reset
// drafts and use the saved weekly rate, including same-week record changes.
const ts=require("typescript");
const vm=require("vm");
const states=[];
let hookIndex=0, updated=false;
const react={
  useState(initial){
    const index=hookIndex++;
    if(!(index in states)) states[index]=typeof initial==="function"?initial():initial;
    return [states[index],value=>{const next=typeof value==="function"?value(states[index]):value;if(!Object.is(next,states[index])){states[index]=next;updated=true;}}];
  },
  useMemo(factory){return factory();},
};
const moduleObject={exports:{}};
const jsx=(type,props)=>({type,props});
vm.runInNewContext(ts.transpileModule(odo,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
  exports:moduleObject.exports,
  require(name){
    if(name==="react")return react;
    if(name==="react/jsx-runtime")return {jsx,jsxs:jsx};
    if(name==="next/navigation")return {useRouter:()=>({refresh(){}})};
    if(name==="@/lib/supabase/client")return {createClient(){throw Error("Unexpected database call during render");}};
    if(name==="@/lib/format")return {formatMoney:value=>String(value)};
    if(name==="next/link")return {default:"a"};
    throw Error("Unexpected import: "+name);
  },
});
function render(props){for(let attempt=0;attempt<10;attempt++){hookIndex=0;updated=false;moduleObject.exports.default(props);if(!updated)return states[0];}throw Error("Odometer render did not settle");}
let props={weekStart:"2026-10-05",weekLabel:"Test week",mileageRate:0.2,mileageFeeActive:true,trucks:[{id:"truck-1",unitNumber:"1",make:"",model:"",currentMileage:null}],records:[{truckId:"truck-1",startOdometer:100,endOdometer:200,ratePerMile:0.3}]};
assert.strictEqual(render(props)["truck-1"].rate,0.3);
states[0]["truck-1"].end="999";
props={...props,records:[{truckId:"truck-1",startOdometer:200,endOdometer:300,ratePerMile:0.4}]};
assert.strictEqual(render(props)["truck-1"].end,"300");
assert.strictEqual(states[0]["truck-1"].rate,0.4);
props={...props,weekStart:"2026-10-12",records:[]};
assert.strictEqual(render(props)["truck-1"].start,"");
assert.strictEqual(states[0]["truck-1"].rate,0.2);
props={...props,mileageRate:0.5};
assert.strictEqual(render(props)["truck-1"].rate,0.5);
props={...props,trucks:[...props.trucks,{id:"truck-2",unitNumber:"2",make:"",model:"",currentMileage:null}]};
assert.ok(render(props)["truck-2"]);
console.log("expense-load-link-odometer-weekly checks passed");
