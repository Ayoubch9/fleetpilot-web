const fs=require("fs");
const assert=require("assert");

const report=fs.readFileSync(
  "src/app/reports/report-actions.tsx",
  "utf8"
);

assert.ok(report.includes("class PdfDocumentBuilder"));
assert.ok(report.includes('type: "application/pdf"'));
assert.ok(report.includes('let pdf = "%PDF-1.4\\n";'));
assert.ok(report.includes("xref\\n0 ${maxId + 1}\\n"));
assert.ok(report.includes("startxref\\n${xrefOffset}\\n%%EOF"));

console.log("reports-pdf-binary-fix checks passed");
