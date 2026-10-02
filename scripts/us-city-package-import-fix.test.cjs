const fs=require("fs");
const assert=require("assert");

const route=fs.readFileSync("src/app/api/us-cities/route.ts","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

assert.ok(route.includes('import geo from "countrycitystatejson";'));
assert.ok(!route.includes('countrycitystatejson/server'));
assert.strictEqual(pkg.dependencies.countrycitystatejson,"26.9.2802");
assert.ok(route.includes('geo.getStatesByShort("US")'));
assert.ok(route.includes('geo.getCities("US", stateName)'));

console.log("us-city-package-import-fix checks passed");
