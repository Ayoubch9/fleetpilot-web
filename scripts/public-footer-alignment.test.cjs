const fs=require("fs"),assert=require("assert");
const footer=fs.readFileSync("src/components/public-footer.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");
assert.ok(footer.includes('className="fp-public-footer-meta"'));
assert.ok(footer.includes('className="fp-public-footer-copy"'));
assert.ok(css.includes("MileVoxa Public Footer Meta Alignment v4.4.1"));
assert.ok(css.includes("justify-items:end!important"));
console.log("public-footer-alignment checks passed");
