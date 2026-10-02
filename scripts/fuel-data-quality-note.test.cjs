const fs=require("fs");
const assert=require("assert");

const fuel=fs.readFileSync("src/app/fuel/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(fuel.includes("fp-fuel-data-note"));
assert.ok(fuel.includes("<strong>Gallons</strong>"));
assert.ok(fuel.includes("<strong>Vendor</strong>"));
assert.ok(fuel.includes("more accurate fuel reports"));
assert.ok(fuel.includes("Pilot AI insights"));

assert.ok(css.includes("MileVoxa Fuel Data Quality Note v4.3.40"));
assert.ok(css.includes(".fp-fuel-data-note"));
assert.ok(css.includes("background:#F4FAF5"));
assert.ok(css.includes("font-size:9px"));

console.log("fuel-data-quality-note checks passed");
