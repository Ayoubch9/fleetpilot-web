const fs=require("fs");
const assert=require("assert");

const route=fs.readFileSync("src/app/api/us-cities/route.ts","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

assert.strictEqual(pkg.dependencies["country-state-city"],"3.2.1");
assert.ok(!pkg.dependencies.countrycitystatejson);
assert.ok(route.includes('import { City, State } from "country-state-city";'));
assert.ok(route.includes('State.getStatesOfCountry("US")'));
assert.ok(route.includes('City.getCitiesOfCountry("US")'));
assert.ok(route.includes("q.length < 2"));
assert.ok(route.includes(".slice(0, 8)"));

console.log("us-city-country-state-city checks passed");
