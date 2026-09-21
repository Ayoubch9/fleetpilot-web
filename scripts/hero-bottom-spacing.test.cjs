const fs=require("fs");
const assert=require("assert");

const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(css.includes("MileVoxa Hero Bottom Spacing v4.3.26"));
assert.ok(css.includes(".mv-live-copy-hero + .fp-marketing-trust-strip"));
assert.ok(css.includes("margin-top:12px!important"));
assert.ok(css.includes("margin-bottom:0!important"));

console.log("hero-bottom-spacing checks passed");
