const fs=require("fs");
const assert=require("assert");

const read=(p)=>fs.readFileSync(p,"utf8");
const expense=read("src/app/expenses/expense-quick-actions.tsx");
const maint=read("src/app/maintenance/maintenance-quick-actions.tsx");
const reimb=read("src/app/reimbursements/reimbursement-quick-actions.tsx");
const reimbPage=read("src/app/reimbursements/page.tsx");
const quick=read("src/components/quick-action-button.tsx");
const palette=read("src/lib/chart-palette.ts");
const taxonomy=read("src/lib/expense-taxonomy.ts");
const reports=read("src/app/reports/page.tsx");
const css=read("src/app/globals.css");

for(const source of [expense,maint,reimb]){
  assert.ok(source.includes('QuickActionButton'));
}
assert.ok(quick.includes('className = `mv-quick-action'));
assert.ok(quick.includes('mv-quick-action-icon'));
assert.ok(quick.includes('mv-quick-action-chevron'));
assert.ok(css.includes(".mv-quick-action{"));
assert.ok(css.includes("border:1px solid #DFE7EF"));
assert.ok(css.includes("background:#FFFFFF"));
assert.ok(css.includes(".mv-quick-action.primary"));
assert.ok(css.includes("linear-gradient(180deg,#16853B 0%,#126F32 100%)"));

assert.ok(reimbPage.includes('<StatusBadge tone={standalone ? "gray" : full ? "green" : "orange"}>'));
assert.ok(reimbPage.includes('{standalone ? "Standalone" : full ? "Full" : "Partial"}'));

assert.ok(palette.includes("EXPENSE_CATEGORY_COLORS"));
assert.ok(palette.includes("Fuel: CHART_PALETTE.green"));
assert.ok(palette.includes("Maintenance: CHART_PALETTE.purple"));
assert.ok(palette.includes("Tolls: CHART_PALETTE.amber"));
assert.ok(palette.includes("Other: CHART_PALETTE.gray"));
assert.ok(taxonomy.includes("EXPENSE_CATEGORY_COLORS.Maintenance"));
assert.ok(reports.includes("summarizeExpenseCategories"));
assert.ok(!reports.includes("chartCategoryColor(idx)"));

console.log("quickactions-palette checks passed");
