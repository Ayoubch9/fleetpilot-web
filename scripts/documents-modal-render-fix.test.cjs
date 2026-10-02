const fs=require("fs");
const assert=require("assert");

const manager=fs.readFileSync("src/app/documents/document-manager.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(manager.includes("createPortal("));
assert.ok(manager.includes("document.body"));

assert.ok(css.includes("MileVoxa Documents Modal Render Fix v4.3.71"));
assert.ok(css.includes(".fp-doc-modal .fp-document-upload-form"));
assert.ok(css.includes("display:grid!important"));
assert.ok(css.includes("height:auto!important"));
assert.ok(css.includes("background:#FFFFFF!important"));
assert.ok(css.includes("overflow:auto!important"));
assert.ok(css.includes(".fp-doc-modal .fp-doc-form-grid"));
assert.ok(css.includes("grid-template-columns:repeat(2,minmax(0,1fr))!important"));
assert.ok(css.includes(".fp-doc-modal .fp-document-form-actions"));
assert.ok(css.includes("position:sticky!important"));

console.log("documents-modal-render-fix checks passed");
