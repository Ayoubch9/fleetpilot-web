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

    if (!user) {
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

    const { data: billing } = await supabase
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("company_id", membership.company_id)
      .maybeSingle();

    if (!billing?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No active billing customer was found. Start a subscription first." },
        { status: 409 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const params = new URLSearchParams();
    params.set("customer", billing.stripe_customer_id);
    params.set("return_url", `${origin}/settings`);

    const session = await stripeRequest("billing_portal/sessions", params);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not open the billing portal.",
      },
      { status: 500 }
    );
  }
}
