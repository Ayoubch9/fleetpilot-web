const fs=require("fs"),assert=require("assert");
const actions=fs.readFileSync("src/app/documents/document-actions.tsx","utf8");
const center=fs.readFileSync("src/app/documents/document-center.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");
assert.ok(actions.includes("Edit Document Information"));
assert.ok(actions.includes("Save Changes"));
assert.ok(actions.includes(".update({"));
for(const key of ["document_type:","truck_id:","folder_id:","jurisdiction:","issue_date:","effective_date:","expiration_date:","document_number:","carry_in_truck:","notes:"]){assert.ok(actions.includes(key),key)}
assert.ok(actions.includes("File stays unchanged"));
assert.ok(actions.includes("createPortal("));
assert.ok(actions.includes("window.document.body"));
assert.ok(center.includes("<DocumentActions"));
assert.ok(center.includes("document={doc}"));
assert.ok(center.includes("issue_date: string | null"));
assert.ok(center.includes("effective_date: string | null"));
assert.ok(center.includes("notes: string | null"));
assert.ok(css.includes("MileVoxa Documents Edit Metadata v4.3.75"));
console.log("documents-edit-metadata checks passed");
