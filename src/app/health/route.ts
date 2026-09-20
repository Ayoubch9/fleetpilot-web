import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const configured = Boolean(supabaseUrl && supabaseKey);

  return NextResponse.json(
    {
      ok: configured,
      app: "milevoxa-web",
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      supabaseConfigured: configured,
      timestamp: new Date().toISOString(),
    },
    { status: configured ? 200 : 503 }
  );
}
