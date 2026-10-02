const fs=require("fs");
const assert=require("assert");

const shell=fs.readFileSync("src/components/app-shell.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(shell.includes('const showWeekSelector = !['));
assert.ok(shell.includes('"expenses"'));
assert.ok(shell.includes('"trucks"'));
assert.ok(shell.includes('"maintenance"'));
assert.ok(shell.includes('"reimbursements"'));
assert.ok(shell.includes("].includes(active)"));
assert.ok(shell.includes("fp-mobile-control-zone-search-only"));
assert.ok(shell.includes("<GlobalSearch />"));

assert.ok(css.includes("MileVoxa Non-Weekly Pages Week Selector Visibility v4.3.51"));
assert.ok(css.includes(".fp-mobile-control-zone.fp-mobile-control-zone-search-only"));

console.log("hide-week-selector-nonweekly-pages checks passed");
