const fs=require("fs");
const assert=require("assert");
const page=fs.readFileSync("src/app/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes('src="/milevoxa-home-hero-visual.jpg"'));
assert.ok(page.includes('href="/signup"'));
assert.ok(page.includes('href="/pricing"'));
assert.ok(page.includes("Join the Free Beta"));
assert.ok(page.includes("Beta Access Details"));
assert.ok(page.includes('className="fp-marketing-button primary large"'));
assert.ok(page.includes('className="fp-marketing-button secondary large"'));
assert.ok(css.includes(".mv-concept-image-only"));
console.log("home-exact-hero checks passed");
