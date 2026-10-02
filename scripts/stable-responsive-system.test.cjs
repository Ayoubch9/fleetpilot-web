const fs=require("fs");
const assert=require("assert");

const css=fs.readFileSync("src/app/globals.css","utf8");
const shell=fs.readFileSync("src/components/app-shell.tsx","utf8");

assert.ok(css.includes("MileVoxa Stable Responsive System v4.3.34"));
assert.ok(css.includes("--mv-app-canvas:1480px"));
assert.ok(css.includes("@media(min-width:1200px)"));
assert.ok(css.includes("@media(min-width:1024px) and (max-width:1199px)"));
assert.ok(css.includes("@media(min-width:651px) and (max-width:1299px)"));
assert.ok(css.includes("grid-template-columns:repeat(2,minmax(0,1fr))!important"));
assert.ok(css.includes("max-width:var(--mv-app-canvas)!important"));
assert.ok(css.includes("overflow-x:auto!important"));

assert.ok(shell.includes("fp-app-content"));
assert.ok(shell.includes("fp-app-header"));
assert.ok(shell.includes("fp-app-mobile-brand"));
assert.ok(shell.includes("fp-app-global-search"));
assert.ok(shell.includes("fp-app-week-selector"));

console.log("stable-responsive-system checks passed");
