import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMileVoxaAccessEntitlement } from "@/lib/beta-access";

export async function getMileVoxaAccount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_path")
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

  const entitlement = await getMileVoxaAccessEntitlement(
    supabase,
    membership?.company_id || null,
    user.created_at
  );

  if (!entitlement.allowed) {
    redirect("/pricing?access=required");
  }

  const avatarUrl = await getAvatarUrl(
    supabase,
    profile?.avatar_path || null
  );

  return {
    supabase,
    user,
    fullName: profile?.full_name || "MileVoxa User",
    avatarPath: profile?.avatar_path || null,
    avatarUrl,
    companyName,
    role: membership?.role || "Member",
    entitlement,
  };
}


export async function getAvatarUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  avatarPath?: string | null
) {
  if (!avatarPath) return null;

  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(avatarPath, 60 * 60);

  if (!error && data?.signedUrl) {
    return data.signedUrl;
  }

  const { data: publicData } = supabase.storage
    .from("avatars")
    .getPublicUrl(avatarPath);

  return publicData?.publicUrl || null;
}
