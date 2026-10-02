const fs=require("fs");
const assert=require("assert");

const shell=fs.readFileSync("src/components/app-shell.tsx","utf8");
const pilot=fs.readFileSync("src/app/pilot-ai/page.tsx","utf8");
const deposit=fs.readFileSync("src/app/security-deposit/page.tsx","utf8");

assert.ok(pilot.includes('active="pilot"'));
assert.ok(deposit.includes('active="deposit"'));
assert.ok(shell.includes('"pilot",'));
assert.ok(shell.includes('"deposit",'));
assert.ok(!shell.includes('"pilot-ai",'));
assert.ok(!shell.includes('"security-deposit",'));

console.log("hide-week-selector-actual-keys checks passed");
