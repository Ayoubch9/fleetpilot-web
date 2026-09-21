const fs=require("fs");
const assert=require("assert");

const signup=fs.readFileSync("src/app/signup/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(signup.includes('className="mv-signup-page grid min-h-screen'));
assert.ok(css.includes(".mv-signup-page .fp-email-signup-legal"));
assert.ok(css.includes("font-size:11px"));
assert.ok(css.includes("color:#5F7188"));

assert.ok(css.includes(".mv-signup-page .mv-auth-input:-webkit-autofill"));
assert.ok(css.includes("-webkit-text-fill-color:#102238!important"));
assert.ok(css.includes("box-shadow:0 0 0 1000px #FFFFFF inset!important"));
assert.ok(css.includes("border-radius:10px!important"));
assert.ok(css.includes("font-size:14px!important"));

assert.ok(signup.includes('lg:grid-cols-[.92fr_1.08fr]'));
assert.ok(signup.includes('bg-[#102238]'));
assert.ok(signup.includes('className="mv-auth-primary"'));
assert.ok(signup.includes('text-4xl font-black'));
assert.ok(signup.includes('text-[10px] font-black uppercase'));

console.log("signup-visual-polish checks passed");
