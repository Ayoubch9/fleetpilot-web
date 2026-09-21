const fs=require("fs");
const assert=require("assert");

const login=fs.readFileSync("src/app/login/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(login.includes('className="mv-login-page grid min-h-screen'));
assert.ok(login.includes('href="/forgot-password"'));
assert.ok(login.includes('Forgot password?'));
assert.ok(login.includes('text-[14px] font-bold text-[#16853B]'));
assert.ok(login.includes('className="-mt-2 text-right"'));

assert.ok(css.includes(".mv-login-page .fp-social-auth-legal,"));
assert.ok(css.includes(".mv-login-page .fp-auth-divider"));
assert.ok(css.includes("font-size:11px"));
assert.ok(css.includes("color:#5F7188"));

assert.ok(css.includes(".mv-login-page .mv-auth-input:-webkit-autofill"));
assert.ok(css.includes("-webkit-text-fill-color:#102238!important"));
assert.ok(css.includes("box-shadow:0 0 0 1000px #FFFFFF inset!important"));
assert.ok(css.includes("border-radius:10px!important"));
assert.ok(css.includes("font-size:14px!important"));

assert.ok(login.includes('lg:grid-cols-[.92fr_1.08fr]'));
assert.ok(login.includes('bg-[#102238]'));
assert.ok(login.includes('className="mv-auth-primary"'));
assert.ok(login.includes('text-4xl font-black'));
assert.ok(login.includes('text-[10px] font-black uppercase'));

console.log("login-visual-polish checks passed");
