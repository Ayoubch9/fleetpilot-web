const fs=require("fs"),assert=require("assert");
const api=fs.readFileSync("src/app/api/us-cities/route.ts","utf8");
const comp=fs.readFileSync("src/app/loads/us-city-state-autocomplete.tsx","utf8");
const form=fs.readFileSync("src/app/loads/add-load-form.tsx","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

assert.strictEqual(pkg.dependencies["country-state-city"],"3.2.1");
assert.ok(api.includes('State.getStatesOfCountry("US")'));
assert.ok(api.includes('City.getCitiesOfCountry("US")'));
assert.ok(api.includes("q.length < 2"));
assert.ok(api.includes(".slice(0, 8)"));
assert.ok(comp.includes("query.length < 2"));
assert.ok(comp.includes("ArrowDown"));
assert.ok(comp.includes("ArrowUp"));
assert.ok(comp.includes("role=\"listbox\""));
assert.ok(comp.includes("Type at least 2 letters"));
assert.strictEqual((form.match(/<UsCityStateAutocomplete/g)||[]).length,2);
assert.ok(!form.includes('label="Pickup City, State *"\\n                value={draft.pickup}'));
console.log("us-city-state-autocomplete checks passed");
