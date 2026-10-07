const fs=require("fs");
const assert=require("assert");
const read=(p)=>fs.readFileSync(p,"utf8");

const pkg=JSON.parse(read("package.json"));
const nextConfig=read("next.config.ts");
const seo=read("src/lib/seo.ts");
const robots=read("src/app/robots.ts");
const sitemap=read("src/app/sitemap.ts");
const privacy=read("src/app/privacy/page.tsx");
const terms=read("src/app/terms/page.tsx");
const deletion=read("src/app/data-deletion/page.tsx");
const legal=read("src/lib/legal.ts");
const securityTxt=read("public/.well-known/security.txt");

assert.ok(["4.7.0","4.7.1"].includes(pkg.version));
assert.strictEqual(pkg.dependencies.next,"16.3.8");
assert.strictEqual(pkg.devDependencies["eslint-config-next"],"16.3.8");

assert.ok(seo.includes('https://www.milevoxa.com'));
assert.ok(nextConfig.includes('destination: "https://www.milevoxa.com/:path*"'));
assert.ok(nextConfig.includes('"X-Content-Type-Options"'));
assert.ok(nextConfig.includes('"Strict-Transport-Security"'));
assert.ok(nextConfig.includes('"Content-Security-Policy"'));
assert.ok(nextConfig.includes('"X-Robots-Tag"'));
assert.ok(nextConfig.includes('"Cache-Control"'));
assert.ok(robots.includes('disallow: ["/api/", "/auth/"]'));
assert.ok(sitemap.includes('absoluteUrl("/contact")'));

assert.ok(privacy.includes("Developer and privacy contact"));
assert.ok(privacy.includes("Technical information and browser storage"));
assert.ok(privacy.includes("localStorage"));
assert.ok(privacy.includes("sessionStorage"));
assert.ok(privacy.includes("Stripe"));
assert.ok(privacy.includes("Regional privacy choices"));
assert.ok(terms.includes("MileVoxa software and intellectual property"));
assert.ok(terms.includes("reverse engineer"));
assert.ok(deletion.includes("Request Account Deletion"));
assert.ok(deletion.includes("mailto:${SUPPORT_EMAIL}"));
assert.ok(legal.includes("October 7, 2026"));
assert.ok(legal.includes("NEXT_PUBLIC_MILEVOXA_DEVELOPER_NAME"));
assert.ok(securityTxt.includes("Canonical: https://www.milevoxa.com/.well-known/security.txt"));

console.log("launch-hardening-v4_7_0 checks passed");
