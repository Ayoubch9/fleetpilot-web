const fs=require("fs");
const assert=require("assert");
const page=fs.readFileSync("src/app/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("Your trucking business,"));
assert.ok(page.includes("organized."));
assert.ok(page.includes('href="/signup"'));
assert.ok(page.includes('href="/pricing"'));
assert.ok(page.includes('src="/milevoxa-home-hero-visual.jpg"'));
assert.ok(!page.includes('src="/milevoxa-home-hero-concept.jpg"'));
assert.ok(css.includes(".mv-concept-image-only"));
assert.ok(css.includes(".mv-concept-image-only-fade"));
assert.ok(css.includes("object-fit:cover!important"));
console.log("home-hero-visual-only checks passed");
