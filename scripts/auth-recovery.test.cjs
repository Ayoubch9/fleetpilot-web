const fs = require("fs");
const assert = require("assert");

const read = (path) => fs.readFileSync(path, "utf8");

const login = read("src/app/login/page.tsx");
const signup = read("src/app/signup/page.tsx");
const forgot = read("src/app/forgot-password/page.tsx");
const reset = read("src/app/reset-password/page.tsx") + read("src/app/reset-password/reset-password-client.tsx");
const settings = read("src/app/settings/settings-center.tsx");
const loginLayout = read("src/app/login/layout.tsx");
const signupLayout = read("src/app/signup/layout.tsx");

assert.ok(login.includes('href="/forgot-password"'));
assert.ok(forgot.includes("resetPasswordForEmail"));
assert.ok(
  forgot.includes("/auth/callback?next=/reset-password"),
  "reset email must return through the server auth callback"
);
assert.ok(
  reset.includes('milevoxa://reset-password/') &&
    reset.includes('token_hash') &&
    reset.includes('type === "recovery"'),
  "reset page must preserve the secure mobile recovery deep-link flow"
);
assert.ok(
  settings.includes("/auth/callback?next=/reset-password"),
  "Settings reset email must use the same real recovery flow"
);

assert.ok(!login.includes("<h2"), "login must not place H2 before H1");
assert.ok(!signup.includes("<h2"), "signup must not place H2 before H1");

assert.ok(signup.includes("Company name (optional)"));
assert.ok(signup.includes('required={false}'));
assert.ok(signup.includes("`${clean} Trucking`"));
assert.ok(signup.includes('"My Trucking Business"'));

assert.ok(loginLayout.includes('title: "Sign In | MileVoxa"'));
assert.ok(signupLayout.includes('title: "Join the Free Beta | MileVoxa"'));
assert.ok(loginLayout.includes("noIndex: true"));
assert.ok(signupLayout.includes("noIndex: true"));

console.log("auth-recovery checks passed");
