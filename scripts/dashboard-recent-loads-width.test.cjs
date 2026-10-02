const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/dashboard/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes('className="fp-dashboard-recent-row mt-3"'));
assert.ok(page.includes('title="Recent Loads"'));
assert.ok(page.includes('title="Recent Activity"'));

assert.ok(css.includes("MileVoxa Dashboard Recent Loads Priority Width v4.3.85"));
assert.ok(css.includes("grid-template-columns:minmax(0,1.35fr) minmax(320px,.65fr)!important"));
assert.ok(css.includes("grid-template-columns:minmax(0,1.25fr) minmax(300px,.75fr)!important"));
assert.ok(css.includes(".fp-recent-loads-table th:nth-child(3)"));
assert.ok(css.includes(".fp-recent-loads-table th:nth-child(4)"));
assert.ok(css.includes(".fp-recent-loads-table th:nth-child(5)"));

console.log("dashboard-recent-loads-width checks passed");
