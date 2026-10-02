const fs=require("fs");
const assert=require("assert");

const route=fs.readFileSync("src/app/api/us-cities/route.ts","utf8");

assert.ok(route.includes('const usCities = City.getCitiesOfCountry("US") ?? [];'));
assert.ok(route.includes("cachedUsCities = usCities"));

console.log("us-city-undefined-fallback checks passed");
