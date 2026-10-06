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

assert.ok(seo.includes('SITE_URL = "https://www.milevoxa.com"'));
assert.ok(root.includes("metadataBase: new URL(SITE_URL)"));
assert.ok(home.includes('title: "MileVoxa | Free Public Beta for Trucking Operations"'));
assert.ok(pricing.includes('title: "Public Beta Access | MileVoxa"'));
assert.ok(tools.includes('path: "/tools"'));
assert.ok(calculator.includes("publicPageMetadata"));
assert.ok(seo.includes("alternates:"));
assert.ok(seo.includes("canonical"));
assert.ok(seo.includes("openGraph:"));
assert.ok(seo.includes("url: canonical"));

for(const path of [
  'absoluteUrl("/")',
  'absoluteUrl("/pricing")',
  'absoluteUrl("/tools")',
  'absoluteUrl("/privacy")',
  'absoluteUrl("/terms")',
  'absoluteUrl("/data-deletion")',
  'absoluteUrl("/contact")',
]){
  assert.ok(sitemap.includes(path), `missing sitemap entry ${path}`);
}

assert.ok(robots.includes('disallow: ["/api/", "/auth/"]'));
assert.ok(robots.includes('sitemap: `${SITE_URL}/sitemap.xml`'));
assert.ok(nextConfig.includes('"X-Robots-Tag"'));
assert.ok(nextConfig.includes('"noindex, nofollow"'));
assert.ok(nextConfig.includes('value: "milevoxa.com"'));
assert.ok(nextConfig.includes('destination: "https://www.milevoxa.com/:path*"'));

assert.ok(home.includes('"@type": "Organization"'));
assert.ok(home.includes('"@type": "WebSite"'));
assert.ok(home.includes('"@type": "FAQPage"'));
assert.ok(home.includes("contactPoint"));
assert.ok(nextConfig.includes('hostname: "images.pexels.com"'));
assert.ok(og.includes("ImageResponse"));
assert.ok(og.includes("1200"));
assert.ok(og.includes("630"));
assert.ok(!root.toLowerCase().includes("preload"));
assert.ok(!root.includes("<head"));
console.log("seo-foundation checks passed");
