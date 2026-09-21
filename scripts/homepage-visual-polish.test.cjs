const fs=require("fs");
const assert=require("assert");

const home=fs.readFileSync("src/app/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(home.includes("See how it works"));
assert.ok(home.includes('className="fp-marketing-button secondary large"'));
assert.ok(home.includes('className="fp-marketing-button ghost large"'));

assert.ok(css.includes(".fp-marketing-page .fp-marketing-trial-pill span"));
assert.ok(css.includes("background:#16853B"));
assert.ok(css.includes(".fp-marketing-page .fp-marketing-dark-copy>span"));
assert.ok(css.includes("color:#55B772"));
assert.ok(css.includes(".fp-marketing-page .fp-marketing-outcomes i"));
assert.ok(css.includes(".fp-marketing-page .fp-preview-chart i"));
assert.ok(css.includes("linear-gradient(180deg,#16853B 0%,#102238 100%)"));

assert.ok(css.includes(".fp-marketing-page .fp-marketing-button.secondary,"));
assert.ok(css.includes(".fp-marketing-page .fp-marketing-button.ghost"));
assert.ok(css.includes("border:1px solid #102238"));

assert.ok(css.includes(".fp-marketing-page .fp-marketing-trust-strip span"));
assert.ok(css.includes("color:#5F7188"));

console.log("homepage-visual-polish checks passed");
