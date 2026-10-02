const fs=require("fs");
const assert=require("assert");

const manager=fs.readFileSync("src/app/documents/document-manager.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(manager.includes("fp-doc-modal-backdrop"));
assert.ok(manager.includes('role="dialog"'));
assert.ok(manager.includes('aria-modal="true"'));
assert.ok(manager.includes('aria-label="Upload Document"'));
assert.ok(manager.includes('aria-label="Import Multiple Documents"'));

assert.ok(css.includes("MileVoxa Documents Centered Modal Forms v4.3.69"));
assert.ok(css.includes("position:fixed"));
assert.ok(css.includes("align-items:center"));
assert.ok(css.includes("justify-content:center"));
assert.ok(css.includes("max-height:calc(100vh - 48px)"));
assert.ok(css.includes("overflow:auto"));
assert.ok(css.includes("body:has(.fp-doc-modal-backdrop)"));

console.log("documents-modal-forms checks passed");
