const fs=require("fs");
const assert=require("assert");

const page=fs.readFileSync("src/app/not-found.tsx","utf8");
const layout=fs.readFileSync("src/components/public-layout.tsx","utf8");
const css=fs.readFileSync("src/app/globals.css","utf8");

assert.ok(page.includes('import { createClient } from "@/lib/supabase/server"'));
assert.ok(page.includes("export default async function NotFound()"));
assert.ok(page.includes("supabase.auth.getUser()"));
assert.ok(page.includes('href={user ? "/dashboard" : "/"}'));
assert.ok(page.includes('{user ? "Back to Dashboard" : "Back to home"}'));

assert.ok(page.includes("<PublicLayout"));
assert.ok(layout.includes("<PublicHeader />"));
assert.ok(layout.includes("<PublicFooter />"));

assert.ok(css.includes(".fp-public-not-found{"));
assert.ok(css.includes("background:#F7F9F8!important"));
assert.ok(css.includes(".fp-public-not-found .fp-state-icon"));
assert.ok(css.includes("background:#EAF6EC!important"));
assert.ok(css.includes("color:#16853B!important"));
assert.ok(css.includes("min-height:46px!important"));
assert.ok(css.includes("border-radius:10px!important"));
assert.ok(css.includes("linear-gradient(180deg,#16853B 0%,#126F32 100%)"));

console.log("branded-404 checks passed");
