const fs=require("fs");
const assert=require("assert");

const src=fs.readFileSync(
  "src/app/documents/document-actions.tsx",
  "utf8"
);

assert.ok(src.includes("document: doc"));
assert.ok(src.includes("window.document.body"));
assert.ok(src.includes("createPortal("));
assert.ok(!src.includes("document.storage_path"));
assert.ok(!src.includes("document.id"));
assert.ok(src.includes("doc.storage_path"));
assert.ok(src.includes("doc.id"));

console.log("documents-edit-portal-target checks passed");
