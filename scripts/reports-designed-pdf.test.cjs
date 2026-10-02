const fs=require("fs");
const assert=require("assert");

const actions=fs.readFileSync(
  "src/app/reports/report-actions.tsx",
  "utf8"
);

assert.ok(actions.includes("buildReportPdfData"));
assert.ok(actions.includes("buildDesignedReportPdf"));
assert.ok(actions.includes("class PdfDocumentBuilder"));
assert.ok(actions.includes("Financial Overview"));
assert.ok(actions.includes("Business Cost Structure"));
assert.ok(actions.includes("Expense Details"));
assert.ok(actions.includes("Day-by-Day Business Activity"));
assert.ok(actions.includes("Truck Performance"));
assert.ok(actions.includes("Page ${index + 1} of ${pdf.pages.length}"));
assert.ok(actions.includes("Helvetica-Bold"));
assert.ok(actions.includes("roundRectCommand"));
assert.ok(actions.includes('type: "application/pdf"'));
assert.ok(!actions.includes("function buildSimplePdf("));

console.log("reports-designed-pdf checks passed");
