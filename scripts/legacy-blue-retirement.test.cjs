const fs=require("fs");
const assert=require("assert");

const css=fs.readFileSync("src/app/globals.css","utf8");
const pilot=fs.readFileSync("src/app/pilot-ai/page.tsx","utf8");

const banned=[
  "#1188ff","#4c98ff","#2389f1","#1788f4","#147cdc","#086ed8",
  "#168eff","#168bf5","#4c8df5","#4a87f2","#b8d9ff","#4e8df5","#eaf3ff"
];

for(const color of banned){
  assert.ok(!css.toLowerCase().includes(color), `legacy color remains: ${color}`);
}

assert.ok(css.includes("background: var(--fp-page);"));

assert.ok(css.includes(".fp-toggle-setting>button.on{"));
assert.ok(css.includes("background:#16853B!important"));

assert.ok(css.includes(".fp-page-button.active,"));
assert.ok(css.includes(".fp-truck-page-button.active,"));
assert.ok(css.includes(".fp-reimb-page-button.active{"));
assert.ok(css.includes("background:#16853B!important"));

assert.ok(css.includes(".fp-quick-modal-footer button.primary,"));
assert.ok(css.includes(".fp-primary-button,"));
assert.ok(css.includes(".fp-quick-row-primary,"));
assert.ok(css.includes("background:linear-gradient(180deg,#16853B 0%,#126F32 100%)!important"));

assert.ok(css.includes(".fp-pilot-orb{"));
assert.ok(css.includes("background:linear-gradient(145deg,#16853B 0%,#126F32 100%)!important"));

assert.ok(css.includes(".fp-ai-message.user{"));
assert.ok(css.includes(".fp-trial-progress-track i{"));

assert.ok(css.includes(".fp-settle-overview-legend .gross{"));
assert.ok(css.includes("background:#102238!important"));
assert.ok(css.includes(".fp-settle-overview-legend .net{"));

assert.ok(css.includes(".fp-deposit-card-heading>div:first-child>span{"));
assert.ok(css.includes("color:#16853B!important"));

assert.ok(css.includes(".fp-alert-center .mv-app-tabs>button:nth-child(2) .mv-app-tab-count"));
assert.ok(css.includes("background:#FFEDEF!important"));
assert.ok(css.includes("color:#C84751!important"));

assert.ok(pilot.includes('className="fp-ai-suggest-spark"'));
assert.ok(css.includes(".fp-ai-suggest-spark{"));
assert.ok(css.includes("color:#16853B"));

assert.ok(css.includes(".fp-state-icon{"));
assert.ok(css.includes("background:#EAF6EC"));

console.log("legacy-blue-retirement checks passed");
