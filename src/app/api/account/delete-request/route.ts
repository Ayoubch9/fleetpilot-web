import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const confirmation = String(body?.confirmation || "").trim();
    const reason = String(body?.reason || "").trim().slice(0, 1000);

    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { error: 'Type "DELETE" exactly to confirm the request.' },
        { status: 400 }
      );
    }

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

    const { data: existing } = await supabase
      .from("account_deletion_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing?.id) {
      return NextResponse.json({
        ok: true,
        message: "A deletion request is already pending.",
      });
    }

    const { error } = await supabase
      .from("account_deletion_requests")
      .insert({
        user_id: user.id,
        company_id: membership.company_id,
        email: user.email || null,
        reason: reason || null,
        status: "pending",
      });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      message:
        "Deletion request submitted. Your account has not been deleted yet.",
    });
  } catch (error) {
    console.error("Account deletion request error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not submit the deletion request.",
      },
      { status: 500 }
    );
  }
}
