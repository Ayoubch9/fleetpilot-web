const fs=require("fs");
const assert=require("assert");

const read=(p)=>fs.readFileSync(p,"utf8");

const loads=read("src/app/loads/page.tsx");
const loadEmpty=read("src/app/loads/load-empty-state.tsx");
const trucks=read("src/app/trucks/page.tsx");
const maintenance=read("src/app/maintenance/page.tsx");
const settlement=read("src/app/settlement/page.tsx");
const reimbursements=read("src/app/reimbursements/page.tsx");
const deposit=read("src/app/security-deposit/security-deposit-manager.tsx");
const promo=read("src/components/promo-banner.tsx");
const tabs=read("src/components/app-tabs.tsx");
const css=read("src/app/globals.css");

assert.ok(loads.includes("<LoadEmptyState />"));
assert.ok(!loads.includes('EmptyState text="No loads match these filters."'));
assert.ok(loadEmpty.includes("No loads found"));
assert.ok(loadEmpty.includes("Add your first load"));
assert.ok(loadEmpty.includes('new CustomEvent("fleetpilot:open-add-load"'));
assert.ok(css.includes(".mv-load-empty-card p"));
assert.ok(css.includes("color:#64748B"));
assert.ok(css.includes("font-size:14px"));
assert.ok(css.includes(".mv-load-empty-card button"));
assert.ok(css.includes("linear-gradient(180deg,#16853B 0%,#126F32 100%)"));

assert.ok(css.includes(".fp-load-side-action.primary,"));
assert.ok(css.includes(".fp-truck-side-action.primary"));
assert.ok(css.includes("background:linear-gradient(180deg,#16853B 0%,#126F32 100%)!important"));

assert.ok(tabs.includes('className={active ? "active" : ""}'));
assert.ok(css.includes(".mv-app-tabs>a.active::after"));
assert.ok(css.includes("background:#16853B!important"));
assert.ok(css.includes(".mv-app-tabs>a.active .mv-app-tab-count"));
assert.ok(css.includes("background:#EAF6EC!important"));

assert.ok(promo.includes("headline"));
assert.ok(promo.includes("subtext"));
assert.ok(promo.includes("cta"));
assert.ok(promo.includes('className="mv-promo-banner"'));

for(const page of [trucks,maintenance,settlement,reimbursements,deposit]){
  assert.ok(page.includes("<PromoBanner"), "missing shared PromoBanner");
}
assert.ok(!trucks.includes("fp-truck-promo"));
assert.ok(!maintenance.includes("fp-maint-promo"));
assert.ok(!settlement.includes("fp-settle-promo"));
assert.ok(!reimbursements.includes("fp-reimb-promo"));

assert.ok(css.includes("background:url('/milevoxa-hero-clean.jpg')"));
assert.ok(css.includes(".mv-promo-banner-content"));
assert.ok(css.includes(".mv-promo-banner a"));

console.log("loads-trucks-promo checks passed");
