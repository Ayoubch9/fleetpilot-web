import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
        { error: "No FleetPilot company is linked to this account." },
        { status: 403 }
      );
    }

    const [
      { data: profile },
      { data: company },
      { data: trucks },
      { data: loads },
      { data: expenses },
      { data: reimbursements },
      { data: maintenance },
      { data: fixedExpenses },
      { data: odometer },
      { data: feeSettings },
      { data: documents },
      { data: preferences },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("companies").select("*").eq("id", membership.company_id).maybeSingle(),
      supabase.from("trucks").select("*").order("unit_number"),
      supabase.from("loads").select("*").order("pickup_date", { ascending: false }),
      supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
      supabase.from("reimbursements").select("*").order("reimbursement_date", { ascending: false }),
      supabase.from("maintenance_records").select("*").order("service_date", { ascending: false }),
      supabase.from("weekly_fixed_expenses").select("*"),
      supabase.from("weekly_odometer_records").select("*").order("week_start", { ascending: false }),
      supabase.from("company_fee_settings").select("*").maybeSingle(),
      supabase
        .from("documents")
        .select("id, name, document_type, truck_id, expiration_date, file_name, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    return NextResponse.json(
      {
        format: "fleetpilot-account-export-v1",
        exportedAt: new Date().toISOString(),
        account: {
          id: user.id,
          email: user.email,
          role: membership.role,
          profile,
        },
        company,
        data: {
          trucks: trucks ?? [],
          loads: loads ?? [],
          expenses: expenses ?? [],
          reimbursements: reimbursements ?? [],
          maintenance: maintenance ?? [],
          weeklyFixedExpenses: fixedExpenses ?? [],
          weeklyOdometerRecords: odometer ?? [],
          companyFeeSettings: feeSettings ?? null,
          documents: documents ?? [],
          preferences: preferences ?? null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "Content-Disposition":
            'attachment; filename="fleetpilot-account-export.json"',
        },
      }
    );
  } catch (error) {
    console.error("FleetPilot export error:", error);
    return NextResponse.json(
      { error: "Could not export FleetPilot account data." },
      { status: 500 }
    );
  }
}
