const fs = require("fs");
const assert = require("assert");

const ledger = fs.readFileSync("src/lib/week-ledger.ts", "utf8");

assert.ok(
  ledger.includes('import { calculateWeekFinance } from "@/lib/week-finance";'),
  "calculateWeekFinance must be a runtime import"
);

const typeImportStart = ledger.indexOf("import type {");
const typeImportEnd = ledger.indexOf('} from "@/lib/week-finance";', typeImportStart);
if (typeImportStart >= 0 && typeImportEnd >= 0) {
  const typeImportBlock = ledger.slice(typeImportStart, typeImportEnd);
  assert.ok(
    !typeImportBlock.includes("calculateWeekFinance"),
    "calculateWeekFinance must not live inside an import type block"
  );
}

assert.ok(ledger.includes("fetchDashboardTrendHistory"));
assert.ok(ledger.includes("const finance = calculateWeekFinance({"));

console.log("week-finance-runtime-import checks passed");
