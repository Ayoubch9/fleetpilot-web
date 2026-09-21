const fs=require("fs");
const assert=require("assert");

const css=fs.readFileSync("src/app/globals.css","utf8");
const page=fs.readFileSync("src/app/page.tsx","utf8");
const layout=fs.readFileSync("src/components/public-layout.tsx","utf8");

assert.ok(page.includes('mainClassName="fp-marketing-page fp-marketing min-h-screen bg-white'));
assert.ok(page.includes('className="fp-marketing-final-cta"'));
assert.ok(layout.includes("<PublicFooter />"));

assert.ok(css.includes(".fp-public-shell .fp-marketing-page{"));
assert.ok(css.includes("display:flow-root"));
assert.ok(css.includes("background:#FFFFFF!important"));

/* Header gutter fix from v4.3.11 must remain. */
assert.ok(css.includes(".fp-public-shell .fp-public-header{"));
assert.ok(css.includes("width:100%!important"));
assert.ok(css.includes("max-width:none!important"));

console.log("homepage-bottom-surface checks passed");
