const fs=require("fs");
const assert=require("assert");

const sql=fs.readFileSync("supabase_load_data_quality_v4_3_15.sql","utf8");
const domain=fs.readFileSync("src/lib/load-domain.ts","utf8");
const add=fs.readFileSync("src/app/loads/add-load-form.tsx","utf8");
const edit=fs.readFileSync("src/app/loads/load-actions.tsx","utf8");
const quick=fs.readFileSync("src/app/loads/loads-quick-actions.tsx","utf8");
const page=fs.readFileSync("src/app/loads/page.tsx","utf8");
const detail=fs.readFileSync("src/app/loads/[id]/page.tsx","utf8");

assert.ok(sql.includes("load_number = '012578'"));
assert.ok(sql.includes("san antonio, tx"));
assert.ok(sql.includes("north salt lake, ut"));
assert.ok(sql.includes("loaded_miles = null"));
assert.ok(sql.includes("deadhead_miles = null"));
assert.ok(sql.includes("'katy,fo,tx'"));
assert.ok(sql.includes("pickup = 'Katy, TX'"));
assert.ok(sql.includes("delivery = 'Katy, TX'"));

assert.ok(sql.includes("milevoxa_valid_us_state_code"));
assert.ok(sql.includes("milevoxa_normalize_us_location"));
assert.ok(sql.includes("milevoxa_validate_load_row"));
assert.ok(sql.includes("A load must have at least 1 total mile."));
assert.ok(sql.includes("before insert or update of pickup, delivery, loaded_miles, deadhead_miles"));

assert.ok(domain.includes("US_STATE_CODES"));
assert.ok(domain.includes("normalizeUsLocation"));
assert.ok(domain.includes("validateLoadMiles"));
assert.ok(domain.includes("allocatedSharedFuelAndTolls"));
assert.ok(domain.includes("sharedFuelAndTollsByWeek"));
assert.ok(domain.includes("profit: rate - allocatedCost"));

for(const source of [add,edit,quick]){
  assert.ok(source.includes("normalizeUsLocation"));
  assert.ok(source.includes("validateLoadMiles"));
}

assert.ok(page.includes('hasVerifiedMiles ? miles.toLocaleString() : "—"'));
assert.ok(page.includes("calculateLoadProfitabilityMap"));
assert.ok(detail.includes("calculateLoadProfitabilityMap"));
assert.ok(detail.includes("Shared Weekly Fuel & Tolls"));
assert.ok(detail.includes("Allocated Weekly Fixed Costs"));

console.log("load-data-quality-profit checks passed");
