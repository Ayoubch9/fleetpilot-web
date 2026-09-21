const fs=require("fs");
const assert=require("assert");

const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(css.includes("MileVoxa Hero Responsive Scale v4.3.28"));
assert.ok(css.includes("@media(min-width:821px) and (max-width:1100px)"));
assert.ok(css.includes("min-height:470px!important"));
assert.ok(css.includes("@media(min-width:601px) and (max-width:820px)"));
assert.ok(css.includes("min-height:420px!important"));
assert.ok(css.includes("@media(max-width:600px)"));
assert.ok(css.includes("min-height:360px!important"));

console.log("hero-responsive-scale checks passed");
