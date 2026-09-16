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

  if (membership?.company_id) {
    redirect("/dashboard");
  }

  const suggestedName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "";

  return (
    <SocialOnboarding
      email={user.email || ""}
      provider="Google"
      suggestedName={String(suggestedName)}
    />
  );
}
