import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getFleetPilotAccount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  let companyName = "";

  if (membership?.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", membership.company_id)
      .maybeSingle();

    companyName = company?.name ?? "";
  }

  return {
    supabase,
    user,
    fullName: profile?.full_name || "FleetPilot User",
    companyName,
    role: membership?.role || "Member",
  };
}
