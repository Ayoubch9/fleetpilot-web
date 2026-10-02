const fs=require("fs"),assert=require("assert");
const form=fs.readFileSync("src/app/loads/add-load-form.tsx","utf8");
const smart=fs.readFileSync("src/app/loads/smart-load-import.tsx","utf8");

assert.ok(form.includes('useState<"manual" | "telegram">("manual")'));
assert.ok(form.includes("setDetailsVisible(nextMode === \"manual\")"));
assert.ok(form.includes('mode === "telegram" && ('));
assert.ok(form.includes("setDetailsVisible(true)"));
assert.ok(form.includes("{detailsVisible && ("));
assert.ok(form.includes("Import Load from Telegram"));
assert.ok(form.includes("Add Load Manually"));
assert.ok(form.includes("Step 1 of 2"));
assert.ok(form.includes("dedicated"));
assert.ok(smart.includes("dedicated = false"));
assert.ok(smart.includes("(open || dedicated)"));
assert.ok(smart.includes("!dedicated &&"));
console.log("load-add-mode-separation checks passed");
