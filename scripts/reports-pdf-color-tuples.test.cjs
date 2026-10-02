const fs=require("fs");
const assert=require("assert");
const src=fs.readFileSync("src/app/reports/report-actions.tsx","utf8");
assert.ok(src.includes("const shade: PdfColor ="));
assert.ok(src.includes("const accent: PdfColor ="));
assert.ok((src.match(/const bg: PdfColor =/g)||[]).length>=2);
console.log("reports-pdf-color-tuples checks passed");
