const fs=require("fs");
const assert=require("assert");

const css=fs.readFileSync("src/app/globals.css","utf8");
const page=fs.readFileSync("src/app/page.tsx","utf8");

assert.ok(page.includes('src="/milevoxa-home-hero-visual.jpg"'));
assert.ok(css.includes("MileVoxa Hero Artwork Frame Removal v4.3.24"));
assert.ok(css.includes("inset:-3px!important"));
assert.ok(css.includes("width:calc(100% + 6px)!important"));
assert.ok(css.includes("height:calc(100% + 6px)!important"));
assert.ok(css.includes("width:27%!important"));
assert.ok(css.includes("rgba(247,249,248,0) 100%"));

console.log("hero-frame-removal checks passed");
