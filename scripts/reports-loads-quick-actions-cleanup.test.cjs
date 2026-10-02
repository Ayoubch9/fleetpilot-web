const fs=require("fs");
const assert=require("assert");

const shell=fs.readFileSync("src/components/app-shell.tsx","utf8");
const quick=fs.readFileSync("src/app/loads/loads-quick-actions.tsx","utf8");
const loads=fs.readFileSync("src/app/loads/page.tsx","utf8");

assert.ok(shell.includes('"reports",'));
assert.ok(quick.includes("Add Load Manually"));
assert.ok(quick.includes("Import from Telegram"));
assert.ok(quick.includes('detail: { mode }'));
assert.ok(!quick.includes("Duplicate Load"));
assert.ok(!quick.includes("Export Loads"));
assert.ok(loads.includes("<LoadsQuickActions />"));
assert.ok(!loads.includes("loads={allLoads}"));
assert.ok(!loads.includes("exportLoads={exportLoads}"));

console.log("reports-loads-quick-actions-cleanup checks passed");
