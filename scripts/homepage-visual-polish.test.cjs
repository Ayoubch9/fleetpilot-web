const fs=require("fs");
const assert=require("assert");
const home=fs.readFileSync("src/app/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(home.includes("Join the Free Beta"));
assert.ok(home.includes("Beta Access Details"));
assert.ok(home.includes('className="fp-marketing-button primary large"'));
assert.ok(home.includes('className="fp-marketing-button secondary large"'));
assert.ok(css.includes(".fp-marketing-page .fp-marketing-trial-pill span"));
assert.ok(css.includes("background:#16853B"));
assert.ok(css.includes(".fp-marketing-page .fp-marketing-trust-strip span"));
console.log("homepage-visual-polish checks passed");
