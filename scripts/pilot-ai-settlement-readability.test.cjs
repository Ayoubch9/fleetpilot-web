const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/pilot-ai/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("fp-pilot-page"));
assert.ok(css.includes("MileVoxa Pilot AI Weekly Settlement Readability v4.3.66"));
assert.ok(css.includes(".fp-pilot-page .fp-ai-message"));
assert.ok(css.includes("font-size:12px!important"));
assert.ok(css.includes(".fp-pilot-page .fp-ai-suggest"));
assert.ok(css.includes("font-size:11px!important"));
assert.ok(css.includes(".fp-pilot-page .fp-ai-insight p"));
assert.ok(css.includes(".fp-pilot-page .fp-ai-composer input"));
assert.ok(css.includes("height:42px!important"));
assert.ok(css.includes(".fp-pilot-page .fp-ai-chip-row button"));
assert.ok(css.includes("@media(max-width:640px)"));

console.log("pilot-ai-settlement-readability checks passed");
