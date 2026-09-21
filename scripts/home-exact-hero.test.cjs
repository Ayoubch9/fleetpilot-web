const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes('src="/milevoxa-home-hero-concept.jpg"'));
assert.ok(page.includes('href="/signup"'));
assert.ok(page.includes('href="/pricing"'));
assert.ok(page.includes('className="mv-exact-hero-link mv-exact-hero-link-primary"'));
assert.ok(page.includes('className="mv-exact-hero-link mv-exact-hero-link-secondary"'));

assert.ok(!page.includes("mv-concept-laptop"));
assert.ok(!page.includes("mv-concept-phone"));
assert.ok(!page.includes("milevoxa-home-web-dashboard.png"));
assert.ok(!page.includes("milevoxa-home-mobile-app.png"));

assert.ok(css.includes(".mv-exact-hero{"));
assert.ok(css.includes(".mv-exact-hero-link-primary{"));
assert.ok(css.includes(".mv-exact-hero-link-secondary{"));

console.log("home-exact-hero checks passed");
