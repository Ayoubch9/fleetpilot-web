const fs=require("fs");
const assert=require("assert");

const support=fs.readFileSync("src/lib/support.ts","utf8");
const privacy=fs.readFileSync("src/app/privacy/page.tsx","utf8");
const terms=fs.readFileSync("src/app/terms/page.tsx","utf8");
const deletion=fs.readFileSync("src/app/data-deletion/page.tsx","utf8");
const legal=fs.readFileSync("src/lib/legal.ts","utf8");

assert.ok(support.includes('SUPPORT_EMAIL = "support@milevoxa.com"'));
assert.ok(support.includes('SUPPORT_RESPONSE_TIME = "48 Hours"'));
assert.ok(privacy.includes("LEGAL_OPERATOR_NAME"));
assert.ok(privacy.includes("Technical information and browser storage"));
assert.ok(privacy.includes("Stripe"));
assert.ok(terms.includes("generally non-refundable"));
assert.ok(terms.includes("reverse engineer"));
assert.ok(terms.includes("LEGAL_OPERATOR_NAME"));
assert.ok(deletion.includes("Request Account Deletion"));
assert.ok(legal.includes('LEGAL_LAST_UPDATED = "October 7, 2026"'));
assert.ok(!terms.includes("TODO:"));
assert.ok(!privacy.includes("TODO:"));
console.log("support-legal-final checks passed");
