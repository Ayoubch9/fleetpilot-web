const fs = require("fs");
const assert = require("assert");

const toolsPage = fs.readFileSync("src/app/tools/page.tsx", "utf8");
const freeTools = fs.readFileSync("src/app/tools/free-tools.tsx", "utf8");
const routePage = fs.readFileSync("src/app/tools/[slug]/page.tsx", "utf8");
const definitions = fs.readFileSync("src/lib/free-tools.ts", "utf8");
const publicLayout = fs.readFileSync("src/components/public-layout.tsx", "utf8");
const rootLayout = fs.readFileSync("src/app/layout.tsx", "utf8");
const css = fs.readFileSync("src/app/globals.css", "utf8");

assert.ok(
  toolsPage.includes('title: "Free Trucking Calculators"'),
  "tools child metadata should not repeat the MileVoxa suffix"
);
assert.ok(
  !toolsPage.includes('title: "Free Trucking Calculators | MileVoxa"')
);
assert.ok(
  rootLayout.includes('template: "%s | MileVoxa"'),
  "root layout must remain the single title suffix source"
);

const overviewH1Count = (toolsPage.match(/<h1\b/g) || []).length +
  (freeTools.match(/<h1\b/g) || []).length;
assert.strictEqual(
  overviewH1Count,
  1,
  "/tools must render exactly one H1"
);
assert.ok(freeTools.includes("<h2>{title}</h2>"));

assert.ok(publicLayout.includes("<PublicFooter />"));
assert.ok(toolsPage.includes("<PublicLayout"));
assert.ok(routePage.includes("<PublicLayout"));

const slugs = [
  "cost-per-mile",
  "load-profit",
  "owner-operator-profit",
  "lease-operator",
  "fuel-cost",
  "rate-per-mile",
];
for (const slug of slugs) {
  assert.ok(definitions.includes(`slug: "${slug}"`), `missing ${slug}`);
}
assert.ok(routePage.includes("generateMetadata"));
assert.ok(routePage.includes("tool.metaDescription"));
assert.ok(routePage.includes("tool.metaTitle"));

assert.ok(
  css.includes(".fp-public-shell .fp-public-header .fp-marketing-button.primary")
);
assert.ok(css.includes("background:#16853B!important"));
assert.ok(
  css.includes(".mv-tools-page .fp-free-tools-menu button.active")
);
assert.ok(
  css.includes(".mv-tools-page .fp-free-tools-menu a.active")
);
assert.ok(
  css.includes(".mv-tools-page .fp-tools-public-hero>span")
);

assert.ok(
  !css.includes("MileVoxa Tools Selector Blue Restore v4.0.6"),
  "the deliberate blue active-selector restore must be removed"
);

console.log("tools-routing checks passed");
