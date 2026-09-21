const fs=require("fs");
const assert=require("assert");

const legal=fs.readFileSync("src/components/legal-page.tsx","utf8");
const layout=fs.readFileSync("src/components/public-layout.tsx","utf8");
const header=fs.readFileSync("src/components/public-header.tsx","utf8");
const footer=fs.readFileSync("src/components/public-footer.tsx","utf8");
const privacy=fs.readFileSync("src/app/privacy/page.tsx","utf8");
const terms=fs.readFileSync("src/app/terms/page.tsx","utf8");
const deletion=fs.readFileSync("src/app/data-deletion/page.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(legal.includes("<PublicLayout"));
assert.ok(layout.includes("<PublicHeader />"));
assert.ok(layout.includes("<PublicFooter />"));

for (const page of [privacy, terms, deletion]) {
  assert.ok(page.includes("<LegalPage"));
}

assert.ok(header.includes("Sign In"));
assert.ok(header.includes("Start Free"));
assert.ok(footer.includes('href="/privacy"'));
assert.ok(footer.includes('href="/terms"'));
assert.ok(footer.includes('href="/data-deletion"'));

assert.ok(css.includes(".fp-public-shell .fp-legal-body section>div"));
assert.ok(css.includes("color:#60728C"));
assert.ok(css.includes("font-size:14px"));
assert.ok(css.includes("line-height:1.6"));

assert.ok(css.includes(".fp-legal-shell"));
assert.ok(css.includes("border-radius:20px"));
assert.ok(css.includes(".fp-legal-hero>span"));
assert.ok(css.includes("color:#16853B"));
assert.ok(css.includes(".fp-legal-body section"));
assert.ok(css.includes("grid-template-columns:220px minmax(0,1fr)"));

console.log("legal-shared-chrome-readability checks passed");
