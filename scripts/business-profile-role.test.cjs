const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const roles = read("src/lib/business-roles.ts");
const signup = read("src/app/signup/page.tsx");
const login = read("src/app/login/page.tsx");
const onboarding = read("src/app/onboarding/social-onboarding.tsx");
const authCallback = read("src/app/auth/callback/route.ts");
const account = read("src/lib/fleetpilot-account.ts");
const settings = read("src/app/settings/settings-center.tsx");
const shell = read("src/components/app-shell.tsx");
const migration = read("supabase_business_profile_setup.sql");

for (const role of ["Owner Operator", "Lease Contractor", "Company Driver", "Fleet Owner"]) {
  assert.ok(roles.includes(`"${role}"`), `business role list includes ${role}`);
}
assert.match(signup, /<select[\s\S]*?required[\s\S]*?value=\{businessRole\}/);
assert.match(signup, /dot_number: dotNumber\.trim\(\)/);
assert.match(signup, /mc_number: mcNumber\.trim\(\)/);
assert.match(signup, /profile_setup_required: true/);
assert.match(login, /profile_setup_required === true[\s\S]*?"\/onboarding"/);
assert.match(authCallback, /profile_setup_required: true/);
assert.match(account, /!membership\?\.company_id[\s\S]*?profile_setup_required === true[\s\S]*?redirect\("\/onboarding"\)/);
assert.match(onboarding, /p_business_role: businessRole/);
assert.match(onboarding, /p_dot_number: dotNumber\.trim\(\) \|\| null/);
assert.match(onboarding, /p_mc_number: mcNumber\.trim\(\) \|\| null/);
assert.match(settings, /\.update\(\{ full_name: name\.trim\(\), business_role: businessRole \}\)/);
assert.match(settings, /<em>\{businessRole \|\| role\}<\/em>/);
assert.match(settings, /Company Access Role/);
assert.match(shell, /businessRole \|\| role \|\| companyName/);
assert.match(migration, /v_user_id uuid := auth\.uid\(\)/);
assert.match(migration, /if v_business_role is null or v_business_role not in/);
assert.match(migration, /v_membership_count > 1/);
assert.match(migration, /lower\(coalesce\(v_membership_role, ''\)\) = 'owner'/);
assert.match(migration, /insert into public\.profiles \(id, full_name, business_role\)/);
assert.match(migration, /revoke all on function public\.complete_fleetpilot_social_onboarding/);

console.log("PASS business role signup, profile display, and tenant-safe onboarding contract");
