const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/pilot-ai/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("fp-tool-page fp-pilot-page"));

assert.ok(css.includes("MileVoxa Pilot AI Typography Alignment v4.3.65"));
assert.ok(css.includes(".fp-pilot-page .fp-tool-heading h1"));
assert.ok(css.includes("font-size:29px!important"));
assert.ok(css.includes(".fp-pilot-page .fp-tool-heading p"));
assert.ok(css.includes("font-size:11px!important"));
assert.ok(css.includes(".fp-pilot-page .fp-ai-message"));
assert.ok(css.includes("font-size:10.5px!important"));
assert.ok(css.includes(".fp-pilot-page .fp-ai-suggest"));
assert.ok(css.includes("font-size:9.5px!important"));
assert.ok(css.includes(".fp-pilot-page .fp-ai-insight p"));
assert.ok(css.includes("@media(max-width:640px)"));

console.log("pilot-ai-typography-alignment checks passed");
