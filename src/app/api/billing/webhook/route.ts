import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!secret || !serviceRole || !supabaseUrl) {
    return NextResponse.json(
      { error: "Webhook environment is not configured." },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!signature || !verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(payload);
  const admin = createSupabaseAdmin(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const companyId =
        session.client_reference_id || session.metadata?.company_id;

      if (companyId && session.customer) {
        await admin.from("billing_customers").upsert({
          company_id: companyId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription || null,
          subscription_status: "active",
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object;
      const companyId = subscription.metadata?.company_id;

      if (companyId) {
        await admin.from("billing_customers").upsert({
          company_id: companyId,
          stripe_customer_id: subscription.customer || null,
          stripe_subscription_id: subscription.id || null,
          subscription_status: subscription.status || "inactive",
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}

function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
) {
  const parts = signatureHeader.split(",");
  const timestamp = parts
    .find((part) => part.startsWith("t="))
    ?.slice(2);
  const signature = parts
    .find((part) => part.startsWith("v1="))
    ?.slice(3);

  if (!timestamp || !signature) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;

  const toleranceSeconds = 300;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== signatureBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
