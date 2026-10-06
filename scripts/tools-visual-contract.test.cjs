const fs=require("fs");
const assert=require("assert");

const tools=fs.readFileSync("src/app/tools/page.tsx","utf8");
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
assert.ok(header.includes("Join the Free Beta"));
assert.ok(css.includes(".fp-public-shell .fp-public-header .fp-marketing-button.primary"));
assert.ok(css.includes(".fp-public-shell .fp-marketing-nav a.active::after"));
assert.ok(tools.includes("FREE TOOLS FOR TRUCKERS"));
assert.ok(tools.includes("FROM CALCULATOR TO CONTROL CENTER"));
assert.ok(css.includes(".mv-tools-page .fp-tools-public-hero>span"));
assert.ok(css.includes(".mv-tools-page .fp-tools-public-bottom>span"));
assert.ok(css.includes(".mv-tools-page .fp-free-tools-menu button.active"));
assert.ok(css.includes(".mv-tools-page .fp-free-tools-menu a.active"));
assert.ok(css.includes(".mv-tools-page .fp-tool-results strong"));
console.log("tools-visual-contract checks passed");
