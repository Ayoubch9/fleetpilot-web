const fs=require("fs");
const assert=require("assert");

const read=(p)=>fs.readFileSync(p,"utf8");

const seo=read("src/lib/seo.ts");
const root=read("src/app/layout.tsx");
const home=read("src/app/page.tsx");
const pricing=read("src/app/pricing/page.tsx");
const tools=read("src/app/tools/page.tsx");
const calculator=read("src/app/tools/[slug]/page.tsx");
const sitemap=read("src/app/sitemap.ts");
const robots=read("src/app/robots.ts");
const nextConfig=read("next.config.ts");
const og=read("src/app/opengraph-image.tsx");

assert.ok(seo.includes('SITE_URL = "https://milevoxa.com"'));
assert.ok(root.includes("metadataBase: new URL(SITE_URL)"));
assert.ok(!root.includes('url: "https://milevoxa.com"'));

assert.ok(home.includes('title: "MileVoxa | Trucking Profit, Expenses & Fleet Management"'));
assert.ok(home.includes('path: "/"'));
assert.ok(pricing.includes('title: "Pricing | MileVoxa - $29/mo per Company"'));
assert.ok(pricing.includes('path: "/pricing"'));
assert.ok(tools.includes('path: "/tools"'));
assert.ok(calculator.includes("publicPageMetadata"));
assert.ok(calculator.includes('path: `/tools/${tool.slug}`'));

assert.ok(seo.includes("alternates:"));
assert.ok(seo.includes("canonical"));
assert.ok(seo.includes("openGraph:"));
assert.ok(seo.includes("url: canonical"));
assert.ok(seo.includes("twitter:"));
assert.ok(seo.includes("images: [SOCIAL_IMAGE_PATH]"));

for(const path of [
  'absoluteUrl("/")',
  'absoluteUrl("/pricing")',
  'absoluteUrl("/tools")',
  'absoluteUrl("/privacy")',
  'absoluteUrl("/terms")',
  'absoluteUrl("/data-deletion")',
]){
  assert.ok(sitemap.includes(path), `missing sitemap entry ${path}`);
}
for(const slug of [
  "cost-per-mile",
  "load-profit",
  "owner-operator-profit",
  "lease-operator",
  "fuel-cost",
  "rate-per-mile",
]){
  assert.ok(read("src/lib/free-tools.ts").includes(`slug: "${slug}"`));
}
assert.ok(sitemap.includes("TOOL_DEFINITIONS.map"));

for(const path of [
  "/dashboard","/loads","/trucks","/expenses","/maintenance",
  "/reimbursements","/settlement","/fuel","/reports","/documents",
  "/pilot-ai","/settings","/login","/signup",
]){
  assert.ok(robots.includes(`"${path}"`), `robots missing ${path}`);
}
assert.ok(robots.includes('sitemap: `${SITE_URL}/sitemap.xml`'));

assert.ok(home.includes('"@type": "Organization"'));
assert.ok(home.includes('"@type": "WebSite"'));
assert.ok(home.includes('"@type": "FAQPage"'));
assert.ok(home.includes("homepageFaqs.map"));

assert.ok(home.includes('import Image from "next/image"'));
assert.ok(home.includes("<Image"));
assert.ok(home.includes("priority"));
assert.ok(!home.includes("fetchPriority="));
assert.ok(nextConfig.includes('hostname: "images.pexels.com"'));

assert.ok(og.includes("ImageResponse"));
assert.ok(og.includes("1200"));
assert.ok(og.includes("630"));

const preloadHits=[];
for(const path of fs.readdirSync("src/app",{withFileTypes:true})) {
  // no-op: static check below is enough for root layout
}
assert.ok(!root.toLowerCase().includes("preload"));
assert.ok(!root.includes("<head"));

console.log("seo-foundation checks passed");
