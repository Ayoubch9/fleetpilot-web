const fs=require("fs");
const assert=require("assert");
const page=fs.readFileSync("src/app/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("Your trucking business,"));
assert.ok(page.includes("<span>organized.</span>"));
assert.ok(page.includes("MileVoxa Public Beta"));
assert.ok(page.includes("Free during beta. No credit card required."));
assert.ok(page.includes('src="/milevoxa-home-hero-visual.jpg"'));
assert.ok(css.includes(".mv-concept-image-only"));
console.log("home-hero-concept checks passed");
