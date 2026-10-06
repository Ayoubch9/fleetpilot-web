const fs=require("fs");
const path=require("path");
const {spawnSync}=require("child_process");

const tests=JSON.parse(
  fs.readFileSync(path.join(process.cwd(),"scripts","regression-test-manifest.json"),"utf8")
);

let failed=0;
for(const test of tests){
  const full=path.join("scripts",test);
  if(!fs.existsSync(full)){
    console.error(`MISSING canonical regression test: ${test}`);
    failed++;
    continue;
  }
  const result=spawnSync(process.execPath,[full],{
    cwd:process.cwd(),
    stdio:"inherit",
  });
  if(result.status!==0) failed++;
}

if(failed){
  console.error(`\n${failed} canonical regression test(s) failed.`);
  process.exit(1);
}
console.log(`\nPASS all ${tests.length} canonical regression tests`);
