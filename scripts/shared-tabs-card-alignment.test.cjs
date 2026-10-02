const fs=require("fs");
const assert=require("assert");

const tabs=fs.readFileSync("src/components/app-tabs.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(tabs.includes("mv-app-tabs"));
assert.ok(css.includes("MileVoxa Shared Tabs Card Alignment v4.3.78"));
assert.ok(css.includes("padding-left:18px!important"));
assert.ok(css.includes("padding-right:18px!important"));
assert.ok(css.includes("padding-left:14px!important"));
assert.ok(css.includes("padding-right:14px!important"));

console.log("shared-tabs-card-alignment checks passed");
