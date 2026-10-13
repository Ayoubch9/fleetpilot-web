const fs=require("fs");
const assert=require("assert");
const page=fs.readFileSync("src/app/page.tsx","utf8");
const css=fs.readFileSync("src/app/home-redesign.module.css","utf8");
assert.ok(page.includes("No spreadsheets. No guesswork."));
assert.ok(css.includes("box-shadow:0 34px 80px"));
assert.ok(css.includes("background:linear-gradient(180deg,var(--deep) 0%,var(--navy) 48%,var(--navy) 100%)"));
assert.ok(css.includes("border-radius:24px"));
console.log("hero-finish checks passed");
