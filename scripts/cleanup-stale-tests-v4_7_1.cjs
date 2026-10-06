const fs=require("fs");
const path=require("path");

const stale=[
  "action-center.test.cjs",
  "fluid-app-layout.test.cjs",
  "hero-bottom-spacing.test.cjs",
  "quickactions-palette.test.cjs",
  "us-city-package-import-fix.test.cjs",
];

let removed=0;
for(const name of stale){
  const target=path.join(process.cwd(),"scripts",name);
  if(fs.existsSync(target)){
    fs.rmSync(target,{force:true});
    console.log(`REMOVED stale regression file: scripts/${name}`);
    removed++;
  }
}
console.log(removed
  ? `Cleanup complete: ${removed} stale file(s) removed.`
  : "Cleanup complete: no stale regression files found.");
