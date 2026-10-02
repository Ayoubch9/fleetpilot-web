const fs=require("fs");
const assert=require("assert");

const manager=fs.readFileSync("src/app/documents/document-manager.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(manager.includes('import { createPortal } from "react-dom";'));
assert.ok(manager.split("createPortal(").length - 1 >= 2);
assert.ok(manager.includes("document.body"));
assert.ok(manager.includes('aria-label="Upload Document"'));
assert.ok(manager.includes('aria-label="Import Multiple Documents"'));

assert.ok(css.includes("MileVoxa Documents Body Portal Modal Fix v4.3.70"));
assert.ok(css.includes("width:100vw!important"));
assert.ok(css.includes("height:100vh!important"));
assert.ok(css.includes("place-items:center!important"));
assert.ok(css.includes("z-index:9999!important"));
assert.ok(css.includes("margin:auto!important"));
assert.ok(css.includes("transform:none!important"));

console.log("documents-body-portal-modal checks passed");
