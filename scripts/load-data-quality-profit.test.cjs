const fs=require("fs");
const assert=require("assert");

const sql=fs.readFileSync("supabase_load_data_quality_v4_3_15.sql","utf8");
const domain=fs.readFileSync("src/lib/load-domain.ts","utf8");
const add=fs.readFileSync("src/app/loads/add-load-form.tsx","utf8");
const edit=fs.readFileSync("src/app/loads/load-actions.tsx","utf8");
const quick=fs.readFileSync("src/app/loads/loads-quick-actions.tsx","utf8");
const page=fs.readFileSync("src/app/loads/page.tsx","utf8");
const detail=fs.readFileSync("src/app/loads/[id]/page.tsx","utf8");
const routeStops=fs.readFileSync("src/lib/load-stops.ts","utf8");
const routeStopsEditor=fs.readFileSync("src/app/loads/load-stops-editor.tsx","utf8");
const cityAutocomplete=fs.readFileSync("src/app/loads/us-city-state-autocomplete.tsx","utf8");
const loadsStyles=fs.readFileSync("src/app/loads/loads-control-center-v1.css","utf8");

assert.ok(sql.includes("milevoxa_valid_us_state_code"));
assert.ok(sql.includes("milevoxa_normalize_us_location"));
assert.ok(sql.includes("milevoxa_validate_load_row"));
assert.ok(sql.includes("A load must have at least 1 total mile."));
assert.ok(domain.includes("US_STATE_CODES"));
assert.ok(domain.includes("normalizeUsLocation"));
assert.ok(domain.includes("validateLoadMiles"));
assert.ok(domain.includes("allocatedSharedFuelAndTolls"));
assert.ok(domain.includes("sharedFuelAndTollsByWeek"));
assert.ok(domain.includes("profit: rate - allocatedCost"));

for(const source of [add,edit]){
  assert.ok(source.includes("normalizeUsLocation"));
  assert.ok(source.includes("validateLoadMiles"));
}
assert.ok(quick.includes('fleetpilot:open-add-load'));
assert.ok(quick.includes('detail: { mode }'));
assert.ok(page.includes('hasVerifiedMiles ? miles.toLocaleString() : "—"'));
assert.ok(page.includes("calculateLoadProfitabilityMap"));
assert.ok(detail.includes("calculateLoadProfitabilityMap"));
assert.ok(detail.includes("Shared Weekly Fuel & Tolls"));
assert.ok(detail.includes("Allocated Weekly Fixed Costs"));
assert.ok(routeStops.includes('error.code === "42703"'));
assert.ok(routeStops.includes('error.code === "PGRST204"'));
assert.ok(page.includes("isMissingRouteStopsColumn(loadError)"));
assert.ok(detail.includes("isMissingRouteStopsColumn(loadResult.error)"));
assert.ok(page.includes('"id, load_number, broker, pickup, delivery, pickup_date, delivery_date, rate, loaded_miles, deadhead_miles, status, truck_id"'));
assert.ok(detail.includes('"id, truck_id, load_number, broker, pickup, delivery, pickup_date, delivery_date, rate, loaded_miles, deadhead_miles, status"'));
assert.ok(routeStopsEditor.includes('import UsCityStateAutocomplete from "./us-city-state-autocomplete"'));
assert.ok(routeStopsEditor.includes('label="City/state *"'));
assert.ok(routeStopsEditor.includes('inputClassName="mv-load-stop-city-input"'));
assert.ok(routeStopsEditor.includes("required"));
assert.ok(cityAutocomplete.includes("value.trim().length >= 2"));
assert.ok(cityAutocomplete.includes("required={required}"));
assert.ok(loadsStyles.includes(".mv-load-stop-city-input{\n  text-align:left;"));
console.log("load-data-quality-profit checks passed");
