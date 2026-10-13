const fs=require("fs");
const assert=require("assert");

const signup=fs.readFileSync("src/app/signup/page.tsx","utf8");
const css=fs.readFileSync("src/app/signup/signup-redesign.module.css","utf8");

assert.ok(signup.includes("mv-signup-page"));
assert.ok(signup.includes("SocialAuthButtons"));
assert.ok(signup.includes("Company Name (optional)"));
assert.ok(signup.includes("Create Free Account"));
assert.ok(signup.includes("STEP 1 OF 2 • INSTANT SETUP"));
assert.ok(signup.includes("Included In Your Account"));
assert.ok(signup.includes('src="/branding/milevoxa-logo-full-dark.png"'));

assert.ok(css.includes(".brandPanel"));
assert.ok(css.includes(".signupPanel"));
assert.ok(css.includes("background:var(--signup-cream)"));
assert.ok(css.includes("--signup-navy:#102238"));
assert.ok(css.includes("--signup-deep:#0B1730"));
assert.ok(css.includes(".passwordWrap"));
assert.ok(css.includes(".googleAuth :global(.fp-social-auth-button)"));
assert.ok(css.includes("box-shadow:0 0 0 1000px #FFFFFF inset!important"));

console.log("signup-visual-polish checks passed");
