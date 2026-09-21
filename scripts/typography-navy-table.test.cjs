const fs=require("fs");
const path=require("path");
const assert=require("assert");

const allowed=new Set([400,500,600,700,800]);
const exts=new Set([".css",".tsx",".ts",".js",".jsx"]);

function walk(dir){
  const out=[];
  for(const name of fs.readdirSync(dir)){
    const full=path.join(dir,name);
    const stat=fs.statSync(full);
    if(stat.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files=walk("src").filter((file)=>exts.has(path.extname(file)));
const badWeights=[];

for(const file of files){
  const text=fs.readFileSync(file,"utf8");
  for(const rx of [
    /font-weight\s*:\s*(\d{3})/gi,
    /font-\[(\d{3})\]/g,
    /fontWeight\s*:\s*(\d{3})/g,
  ]){
    for(const match of text.matchAll(rx)){
      const weight=Number(match[1]);
      if(!allowed.has(weight)) badWeights.push(`${file}:${weight}`);
    }
  }
}
assert.deepStrictEqual(badWeights,[],"non-standard weights remain");

const sanctioned=new Set(["#102238","#0b1730"]);
const darkNavyLike=[];
for(const file of files.filter((file)=>[".css",".tsx",".ts"].includes(path.extname(file)))){
  const text=fs.readFileSync(file,"utf8");
  for(const match of text.matchAll(/#[0-9a-fA-F]{6}/g)){
    const color=match[0].toLowerCase();
    if(sanctioned.has(color)) continue;
    const r=parseInt(color.slice(1,3),16);
    const g=parseInt(color.slice(3,5),16);
    const b=parseInt(color.slice(5,7),16);
    if(Math.max(r,g,b)<=80 && b>=r && b>=g && b-r>=5){
      darkNavyLike.push(`${file}:${color}`);
    }
  }
}
assert.deepStrictEqual(darkNavyLike,[],"near-navy variants remain");

const shell=fs.readFileSync("src/components/app-shell.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(shell.includes('className="mv-app-shell min-h-screen'));
assert.ok(css.includes(".mv-app-shell th{"));
assert.ok(css.includes("background:#F1F5F9!important"));
assert.ok(css.includes("padding:12px 16px!important"));
assert.ok(css.includes("color:#0B1730!important"));
assert.ok(css.includes("font-size:11px!important"));
assert.ok(css.includes("font-weight:600!important"));
assert.ok(css.includes("text-transform:uppercase!important"));

for(const page of [
  "loads","trucks","expenses","fuel","maintenance","reports","documents","reimbursements"
]){
  const text=fs.readFileSync(`src/app/${page}/page.tsx`,"utf8");
  assert.ok(text.includes("<AppShell"),`${page} does not use AppShell`);
}

console.log("typography-navy-table checks passed");
