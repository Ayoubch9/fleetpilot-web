const fs=require("fs");
const assert=require("assert");
const css=fs.readFileSync("src/app/home-redesign.module.css","utf8");
assert.ok(css.includes(".driverHero{"));
assert.ok(css.includes("padding:48px 0 80px"));
assert.ok(css.includes(".driverHeroLayout"));
assert.ok(css.includes("align-items:center"));
assert.ok(css.includes(".driverTripCard"));
console.log("hero-full-height checks passed");
