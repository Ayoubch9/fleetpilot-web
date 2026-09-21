const fs=require("fs");
const assert=require("assert");

const css=fs.readFileSync("src/app/globals.css","utf8");
const page=fs.readFileSync("src/app/page.tsx","utf8");

assert.ok(page.includes('src="/milevoxa-home-hero-visual.jpg"'));
assert.ok(css.includes("MileVoxa Hero Full-Height Visual v4.3.27"));
assert.ok(css.includes("grid-template-rows:minmax(500px,auto)!important"));
assert.ok(css.includes("align-self:stretch!important"));
assert.ok(css.includes("height:100%!important"));
assert.ok(css.includes("object-fit:cover!important"));

console.log("hero-full-height checks passed");
