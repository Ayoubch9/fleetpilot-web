const fs=require("fs");
const assert=require("assert");

const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(css.includes("MileVoxa Dashboard Recent Loads Typography v4.3.86"));
assert.ok(css.includes("font-size:8.5px!important"));
assert.ok(css.includes("font-size:9.5px!important"));
assert.ok(css.includes("font-size:9px!important"));
assert.ok(css.includes("font-size:10px!important"));

console.log("dashboard-recent-loads-typography checks passed");
