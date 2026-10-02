const fs=require("fs");
const assert=require("assert");

const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(css.includes("MileVoxa Documents Modal Legacy Position Reset v4.3.73"));
assert.ok(css.includes(".fp-doc-modal .fp-document-upload-form"));
assert.ok(css.includes("inset:auto!important"));
assert.ok(css.includes("right:auto!important"));
assert.ok(css.includes("left:auto!important"));
assert.ok(css.includes("top:auto!important"));
assert.ok(css.includes("bottom:auto!important"));
assert.ok(css.includes("translate:none!important"));
assert.ok(css.includes("transform:none!important"));
assert.ok(css.includes("margin-left:0!important"));
assert.ok(css.includes("margin-right:0!important"));

console.log("documents-modal-position-reset checks passed");
