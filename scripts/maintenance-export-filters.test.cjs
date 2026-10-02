const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/maintenance/page.tsx","utf8");
const quick=fs.readFileSync("src/app/maintenance/maintenance-quick-actions.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes("export_status: state(record)"));
assert.ok(page.includes("records={records.map"));
assert.ok(quick.includes("openExportDialog"));
assert.ok(quick.includes("exportServiceFrom"));
assert.ok(quick.includes("exportServiceTo"));
assert.ok(quick.includes("exportDueFrom"));
assert.ok(quick.includes("exportDueTo"));
assert.ok(quick.includes("exportStatus"));
assert.ok(quick.includes("exportTruck"));
assert.ok(quick.includes("exportServiceType"));
assert.ok(quick.includes("All Statuses"));
assert.ok(quick.includes("All Trucks"));
assert.ok(quick.includes("All Service Types"));
assert.ok(quick.includes("matchesDueFrom"));
assert.ok(quick.includes("matchesStatus"));
assert.ok(quick.includes("matchesTruck"));
assert.ok(quick.includes("Next Due Date"));
assert.ok(quick.includes("Status"));
assert.ok(quick.includes("Truck Unit"));
assert.ok(quick.includes("No maintenance records match the selected export filters."));
assert.ok(css.includes("MileVoxa Maintenance Export Filters v4.3.48"));
assert.ok(css.includes(".fp-maint-export-modal"));

console.log("maintenance-export-filters checks passed");
