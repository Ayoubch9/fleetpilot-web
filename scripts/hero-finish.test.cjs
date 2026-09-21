const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes('src="/milevoxa-home-hero-visual.jpg"'));
assert.ok(css.includes("MileVoxa Hero Final Blend + Edge Fit v4.3.23"));
assert.ok(css.includes("align-self:stretch!important"));
assert.ok(css.includes("height:100%!important"));
assert.ok(css.includes("width:calc(100% + 2px)!important"));
assert.ok(css.includes("height:calc(100% + 2px)!important"));
assert.ok(css.includes("rgba(247,249,248,.18) 16%"));
assert.ok(css.includes("rgba(247,249,248,0) 24%"));

console.log("hero-finish checks passed");
