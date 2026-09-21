const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes('src="/milevoxa-home-web-dashboard.png"'));
assert.ok(page.includes('src="/milevoxa-home-mobile-app.png"'));
assert.ok(page.includes("WEB + MOBILE"));
assert.ok(page.includes("Run the same operation from anywhere."));
assert.ok(page.includes('className="mv-concept-road"'));

assert.ok(css.includes(".mv-concept-laptop{"));
assert.ok(css.includes(".mv-concept-phone{"));
assert.ok(css.includes(".mv-concept-product-note{"));
assert.ok(css.includes("background:#0B1730"));
assert.ok(css.includes("color:#16853B"));

console.log("home-hero-concept checks passed");
