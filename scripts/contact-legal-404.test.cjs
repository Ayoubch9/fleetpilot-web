const fs=require("fs");
const assert=require("assert");
const privacy=fs.readFileSync("src/app/privacy/page.tsx","utf8");
const terms=fs.readFileSync("src/app/terms/page.tsx","utf8");
const footer=fs.readFileSync("src/components/public-footer.tsx","utf8");
const contact=fs.readFileSync("src/app/contact/page.tsx","utf8");
const form=fs.readFileSync("src/app/contact/contact-form.tsx","utf8");
const notFound=fs.readFileSync("src/app/not-found.tsx","utf8");

assert.ok(privacy.includes("SUPPORT_EMAIL"));
assert.ok(terms.includes("Refund policy."));
assert.ok(terms.includes("Cancellation."));
assert.ok(footer.includes('href="/contact"'));
assert.ok(contact.includes("SUPPORT_RESPONSE_TIME"));
assert.ok(form.includes("mailto:${SUPPORT_EMAIL}"));
assert.ok(notFound.includes('href="/"'));
assert.ok(notFound.includes("Back to Home"));
assert.ok(!notFound.includes("Back to Dashboard"));
console.log("contact-legal-404 checks passed");
