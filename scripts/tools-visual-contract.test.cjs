const fs=require("fs");
const assert=require("assert");

const tools=fs.readFileSync("src/app/tools/page.tsx","utf8");
const freeTools=fs.readFileSync("src/app/tools/free-tools.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");
const layout=fs.readFileSync("src/components/public-layout.tsx","utf8");
const header=fs.readFileSync("src/components/public-header.tsx","utf8");

assert.ok(tools.includes("<PublicLayout"));
assert.ok(layout.includes("<PublicHeader />"));
assert.ok(layout.includes("<PublicFooter />"));

assert.ok(header.includes('href="/#features">Features'));
assert.ok(header.includes('href="/tools">Free Tools'));
assert.ok(header.includes('href="/pricing">Pricing'));
assert.ok(header.includes('href="/#about">About'));
assert.ok(header.includes('className="fp-marketing-button primary"'));
assert.ok(header.includes("Start Free"));

assert.ok(css.includes(".fp-public-shell .fp-public-header .fp-marketing-button.primary"));
assert.ok(css.includes("min-height:46px!important"));
assert.ok(css.includes("border-radius:10px!important"));
assert.ok(css.includes("linear-gradient(180deg,#16853B 0%,#126F32 100%)"));

assert.ok(css.includes(".fp-public-shell .fp-marketing-nav a.active::after"));
assert.ok(css.includes("background:#16853B!important"));

assert.ok(tools.includes("FREE TOOLS FOR TRUCKERS"));
assert.ok(tools.includes("FROM CALCULATOR TO CONTROL CENTER"));
assert.ok(css.includes(".mv-tools-page .fp-tools-public-hero>span"));
assert.ok(css.includes(".mv-tools-page .fp-tools-public-bottom>span"));

assert.ok(css.includes("background:linear-gradient(180deg,#06182D 0%,#0B2038 100%)"));
assert.ok(css.includes(".mv-tools-page .fp-free-tools-menu button.active"));
assert.ok(css.includes(".mv-tools-page .fp-free-tools-menu a.active"));
assert.ok(css.includes("background:#16853B!important"));

assert.ok(css.includes(".mv-tools-page .fp-tool-results strong"));
assert.ok(css.includes("font-size:28px!important"));
assert.ok(css.includes("font-weight:700!important"));
assert.ok(css.includes("color:#16853B!important"));

console.log("tools-visual-contract checks passed");
