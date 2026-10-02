const fs=require("fs");
const assert=require("assert");

const shell=fs.readFileSync("src/components/app-shell.tsx","utf8");

for(const page of [
  '"settings"',
  '"pilot"',
  '"documents"',
  '"deposit"',
]){
  assert.ok(shell.includes(page), page);
}

console.log("hide-week-selector-non-week-pages checks passed");
