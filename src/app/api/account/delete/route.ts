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
        { error: 'Type "DELETE" exactly to confirm account deletion.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase.rpc(
      "delete_my_fleetpilot_account",
      {
        p_confirmation: confirmation,
        p_reason: reason || null,
      }
    );

    if (error) {
      return NextResponse.json(
        {
          error: [error.message, error.details, error.hint]
            .filter(Boolean)
            .join(" · "),
          code: error.code || null,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      result: data,
      message: "Your MileVoxa account has been deleted.",
    });
  } catch (error) {
    console.error("MileVoxa account deletion error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not delete the MileVoxa account.",
      },
      { status: 500 }
    );
  }
}
