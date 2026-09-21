const fs=require("fs");
const assert=require("assert");

const css=fs.readFileSync("src/app/globals.css","utf8");
const header=fs.readFileSync("src/components/public-header.tsx","utf8");
const layout=fs.readFileSync("src/components/public-layout.tsx","utf8");

assert.ok(layout.includes("<PublicHeader />"));
assert.ok(header.includes('className="fp-marketing-header fp-public-header"'));

assert.ok(css.includes(".fp-public-shell .fp-public-header{"));
assert.ok(css.includes("width:100%!important"));
assert.ok(css.includes("max-width:none!important"));
assert.ok(css.includes("background:#FFFFFF!important"));
assert.ok(css.includes("calc((100vw - 1440px)/2 + 38px)"));

assert.ok(header.includes("Features"));
assert.ok(header.includes("Free Tools"));
assert.ok(header.includes("Pricing"));
assert.ok(header.includes("About"));
assert.ok(header.includes("Sign In"));
assert.ok(header.includes("Start Free"));

console.log("public-header-full-width checks passed");
