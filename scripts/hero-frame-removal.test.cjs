const fs=require("fs");
const assert=require("assert");
const page=fs.readFileSync("src/app/page.tsx","utf8");
const css=fs.readFileSync("src/app/home-redesign.module.css","utf8");
assert.ok(!page.includes('src="/milevoxa-home-hero-visual.jpg"'));
assert.ok(page.includes('aria-label="Illustrative MileVoxa trip profit card"'));
assert.ok(css.includes(".driverTripCard"));
assert.ok(css.includes(".tripHeader"));
console.log("hero-frame-removal checks passed");
