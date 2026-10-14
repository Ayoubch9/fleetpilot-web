const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const css = read("src/app/readability-layout-audit-v1.css");

assert.match(read("src/app/layout.tsx"), /readability-layout-audit-v1\.css/);

for (const [route, component, host, formClass] of [
  ["loads", "add-load-form.tsx", "fp-loads-heading #add-load", "fp-add-load-form"],
  ["trucks", "add-truck-form.tsx", "fp-trucks-heading #add-truck", "fp-add-truck-form"],
  ["expenses", "add-expense-form.tsx", "fp-expenses-heading #add-expense", "fp-add-expense-form"],
  ["maintenance", "add-maintenance-form.tsx", "fp-maint-heading #add-maintenance", "fp-add-maint-form"],
  ["reimbursements", "add-reimbursement-form.tsx", "fp-reimb-heading #add-reimbursement", "fp-add-reimb-form"],
]) {
  assert.match(read(`src/app/${route}/${component}`), new RegExp(formClass));
  assert.ok(css.includes(`${host} > form.${formClass}`), `${route} has a viewport-sized mobile form rule`);
}

assert.match(css, /width:\s*calc\(100vw\s*-\s*24px\)\s*!important/);
assert.match(css, /max-width:\s*743px/);
assert.match(css, /font-size:\s*16px\s*!important/);
assert.match(css, /min-width:\s*220px\s*!important/);
assert.match(css, /font-size:\s*14px\s*!important/);
assert.match(css, /\.fp-beta-access-actions > div:first-child span[\s\S]*?font-size:\s*14px\s*!important/);
assert.match(css, /\.fp-action-copy span[\s\S]*?font-size:\s*13px\s*!important/);
assert.match(css, /\.mv-reports-control-center \.mv-kpi-value[\s\S]*?font-size:\s*24px\s*!important/);
assert.match(css, /\.fp-document-type-donut\) span[\s\S]*?font-size:\s*12px\s*!important/);
assert.match(css, /\.fp-expense-popover[\s\S]*?\.fp-settle-filter-portal[\s\S]*?font-size:\s*14px\s*!important/);
assert.match(css, /@media \(max-width:\s*743px\)[\s\S]*?\.fp-settle-filter-portal\) :is\(input, select, textarea\)[\s\S]*?font-size:\s*16px\s*!important/);

const settings = read("src/app/settings/settings-center.tsx");
assert.match(settings, /Company fees and fixed weekly costs are shared across your[\s\S]*?MileVoxa workspace/);
assert.match(settings, /<strong>Shared across MileVoxa<\/strong>/);
const deposit = read("src/app/security-deposit/security-deposit-manager.tsx");
assert.match(deposit, /These company settings guide the deposit balances shown in[\s\S]*?Weekly Settlement/);

for (const [route, file, selector] of [
  ["privacy", "privacy/privacy-redesign.module.css", ".policyBody li"],
  ["terms", "terms/terms-redesign.module.css", ".termsBody p"],
  ["data deletion", "data-deletion/data-deletion-redesign.module.css", ".deletionBody li"],
]) {
  const moduleCss = read(`src/app/${file}`);
  const mobileRules = moduleCss.slice(moduleCss.lastIndexOf("@media"));
  assert.ok(mobileRules.includes(selector), `${route} includes mobile legal copy sizing`);
  assert.match(mobileRules, /font-size:\s*14px/);
}

const pricing = read("src/app/pricing/pricing-redesign.module.css");
assert.match(pricing, /\.hero h1 span\s*\{\s*white-space:\s*nowrap/s);
assert.match(pricing, /\.faqList p[\s\S]*?font-size:\s*14px/);

console.log("Readability and responsive layout audit checks passed.");
