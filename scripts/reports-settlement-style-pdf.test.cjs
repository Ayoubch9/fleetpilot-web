const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/reports/page.tsx","utf8");
const actions=fs.readFileSync("src/app/reports/report-actions.tsx","utf8");
const settlement=fs.readFileSync("src/app/settlement/settlement-quick-actions.tsx","utf8");

assert.ok(page.includes("companyName={companyName}"));
assert.ok(actions.includes("async function exportPdf()"));
assert.ok(actions.includes("buildReportPdfData"));
assert.ok(actions.includes("buildDesignedReportPdf"));
assert.ok(actions.includes("loadPdfLogo"));
assert.ok(actions.includes("anchor.download = `milevoxa-business-report-"));
assert.ok(actions.includes("Preparing PDF..."));
assert.ok(actions.includes('type: "application/pdf"'));
assert.ok(settlement.includes("function buildSimplePdf"));
assert.ok(settlement.includes("MILEVOXA WEEKLY SETTLEMENT"));
console.log("reports-settlement-style-pdf checks passed");
