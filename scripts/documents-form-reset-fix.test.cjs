const fs=require("fs");
const assert=require("assert");

const manager=fs.readFileSync(
  "src/app/documents/document-manager.tsx",
  "utf8"
);

assert.ok(manager.includes("const formElement=e.currentTarget"));
assert.ok(manager.includes("const form=new FormData(formElement)"));
assert.ok(manager.includes('const input=formElement.elements.namedItem("files")'));
assert.strictEqual(
  (manager.match(/formElement\.reset\(\)/g)||[]).length,
  2
);
assert.ok(!manager.includes("e.currentTarget.reset()"));

console.log("documents-form-reset-fix checks passed");
