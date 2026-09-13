import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripeRequest } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("company_members")
      .select("company_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership?.company_id) {
      return NextResponse.json(
        { error: "No company is linked to this account." },
        { status: 403 }
      );
    }

    if ((membership.role || "").toLowerCase() !== "owner") {
      return NextResponse.json(
        { error: "Only the company owner can manage billing." },
        { status: 403 }
      );
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "Subscription billing is not configured yet." },
        { status: 503 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");
    params.set("success_url", `${origin}/settings?billing=success`);
    params.set("cancel_url", `${origin}/settings?billing=cancelled`);
    params.set("client_reference_id", membership.company_id);
    params.set("customer_email", user.email);
    params.set("metadata[company_id]", membership.company_id);
    params.set(
      "subscription_data[metadata][company_id]",
      membership.company_id
    );

    const session = await stripeRequest("checkout/sessions", params);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing checkout error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not start subscription checkout.",
      },
      { status: 500 }
    );
  }
}
