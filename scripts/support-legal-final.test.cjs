const fs=require("fs");
const assert=require("assert");

const support=fs.readFileSync("src/lib/support.ts","utf8");
const privacy=fs.readFileSync("src/app/privacy/page.tsx","utf8");
const terms=fs.readFileSync("src/app/terms/page.tsx","utf8");
const contact=fs.readFileSync("src/app/contact/page.tsx","utf8");
const form=fs.readFileSync("src/app/contact/contact-form.tsx","utf8");

assert.ok(support.includes('SUPPORT_EMAIL = "Support@MileVoxa.com"'));
assert.ok(support.includes('SUPPORT_RESPONSE_TIME = "48 Hours"'));
assert.ok(privacy.includes("within 48 hours"));
assert.ok(terms.includes("generally non-refundable"));
assert.ok(terms.includes("duplicate or erroneous charge"));
assert.ok(terms.includes("end of the current paid billing period"));
assert.ok(terms.includes("prorated refunds or credits"));
assert.ok(!terms.includes("TODO:"));
assert.ok(!privacy.includes("TODO:"));
assert.ok(!contact.includes("TODO:"));
assert.ok(!form.includes("TODO:"));
console.log("support-legal-final checks passed");
