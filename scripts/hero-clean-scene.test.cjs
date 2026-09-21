const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes('src="/milevoxa-home-hero-visual.jpg"'));
assert.ok(css.includes("MileVoxa Hero Clean Scene Crop v4.3.25"));
assert.ok(css.includes("height:auto!important"));
assert.ok(css.includes("inset:0!important"));
assert.ok(css.includes("width:100%!important"));
assert.ok(css.includes("height:100%!important"));
assert.ok(css.includes("width:18%!important"));
assert.ok(css.includes("border-radius:0!important"));

console.log("hero-clean-scene checks passed");
