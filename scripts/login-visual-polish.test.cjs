const fs=require("fs");
const assert=require("assert");

const login=fs.readFileSync("src/app/login/page.tsx","utf8");
const css=fs.readFileSync("src/app/login/login-redesign.module.css","utf8");

assert.ok(login.includes("mv-login-page"));
assert.ok(login.includes('href="/forgot-password"'));
assert.ok(login.includes("Forgot password?"));
assert.ok(login.includes("SocialAuthButtons"));
assert.ok(login.includes("Sign In to Dashboard"));
assert.ok(login.includes("Access Your Business"));
assert.ok(login.includes("CARRIER PORTAL LOGIN"));
assert.ok(login.includes("Weekly Settlement Preview"));
assert.ok(login.includes("showPassword"));
assert.ok(login.includes('src="/branding/milevoxa-logo-full-dark.png"'));

assert.ok(css.includes(".brandPanel"));
assert.ok(css.includes(".loginPanel"));
assert.ok(css.includes("background:var(--login-cream)"));
assert.ok(css.includes("--login-navy:#102238"));
assert.ok(css.includes("--login-deep:#0B1730"));
assert.ok(css.includes(".passwordWrap"));
assert.ok(css.includes(".googleAuth :global(.fp-social-auth-button)"));
assert.ok(css.includes("box-shadow:0 0 0 1000px #FFFFFF inset!important"));

console.log("login-visual-polish checks passed");
