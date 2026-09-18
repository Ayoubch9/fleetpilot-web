import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  let next = requestUrl.searchParams.get("next") || "/dashboard";

  if (!next.startsWith("/")) {
    next = "/dashboard";
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?auth_error=missing_code", requestUrl.origin)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("auth_error", "oauth_callback");
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login?auth_error=no_session", requestUrl.origin)
    );
  }

  // A deleted Google identity may be recreated by the OAuth provider/Supabase.
  // Do not silently recreate FleetPilot business data. Send the user to an
  // explicit decision screen first.
  const { data: previouslyDeleted, error: deletedCheckError } =
    await supabase.rpc("is_fleetpilot_deleted_account");

  if (!deletedCheckError && previouslyDeleted === true) {
    return safeRedirect(request, requestUrl, "/account-deleted");
  }

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // Existing FleetPilot user: continue directly into the requested page.
  if (membership?.company_id) {
    // Backfill a missing profile name when Google supplied one.
    if (!profile?.full_name) {
      const providerName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "";

      if (providerName) {
        await supabase.from("profiles").upsert({
          id: user.id,
          full_name: String(providerName).trim(),
        });
      }
    }

    return safeRedirect(request, requestUrl, next);
  }

  // New social user: collect company information before creating
  // the company + owner membership.
  return safeRedirect(request, requestUrl, "/onboarding");
}

function safeRedirect(
  request: Request,
  requestUrl: URL,
  path: string
) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto =
    request.headers.get("x-forwarded-proto") || "https";
  const isLocal = process.env.NODE_ENV === "development";

  if (!isLocal && forwardedHost) {
    return NextResponse.redirect(
      `${forwardedProto}://${forwardedHost}${path}`
    );
  }

  return NextResponse.redirect(new URL(path, requestUrl.origin));
}
