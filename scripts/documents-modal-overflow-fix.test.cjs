const fs=require("fs");
const assert=require("assert");

const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(css.includes("MileVoxa Documents Modal Narrow-Viewport Overflow Fix v4.3.72"));
assert.ok(css.includes("overflow-x:hidden!important"));
assert.ok(css.includes("max-width:calc(100vw - 32px)!important"));
assert.ok(css.includes(".fp-doc-modal *"));
assert.ok(css.includes("min-width:0!important"));
assert.ok(css.includes("grid-template-columns:minmax(0,1fr)!important"));
assert.ok(css.includes("@media(max-width:420px)"));
assert.ok(css.includes("width:calc(100vw - 12px)!important"));

console.log("documents-modal-overflow-fix checks passed");
