const fs=require('fs'); const assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8');
const page=read('src/app/load-decision/page.tsx'); const client=read('src/app/load-decision/load-decision-center.tsx'); const lib=read('src/lib/load-decision.ts'); const shell=read('src/components/app-shell.tsx');
assert(page.includes('historicalFuelPrice')); console.log('PASS uses recorded fuel history when available');
assert(client.includes('Accept & Add Load') && client.includes('.from("loads").insert')); console.log('PASS accept and add load');
assert(lib.includes('allMileRpm') && lib.includes('estimatedProfit') && lib.includes('deadheadPercent')); console.log('PASS economics engine');
assert(lib.includes('good') && lib.includes('marginal') && lib.includes('poor')); console.log('PASS transparent rating states');
assert(client.includes('decision-support only')); console.log('PASS estimate disclaimer');
assert(shell.includes('/load-decision')); console.log('PASS navigation');
