import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SocialOnboarding from "./social-onboarding";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_role")
    .eq("id", user.id)
    .maybeSingle();

  const isPendingSignup = user.user_metadata?.profile_setup_required === true;
  if (membership?.company_id && !isPendingSignup && profile?.business_role) {
    redirect("/dashboard");
  }

  const suggestedName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "";

  return (
    <SocialOnboarding
      email={user.email || ""}
      provider={user.app_metadata?.provider === "google" ? "Google" : "email"}
      suggestedName={String(suggestedName)}
      suggestedCompanyName={String(user.user_metadata?.company_name || "")}
      suggestedRole={String(user.user_metadata?.business_role || "")}
      suggestedDotNumber={String(user.user_metadata?.dot_number || "")}
      suggestedMcNumber={String(user.user_metadata?.mc_number || "")}
    />
  );
}
