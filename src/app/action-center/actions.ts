"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function identity() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");
  const { data: membership } = await supabase.from("company_members").select("company_id").eq("user_id", user.id).maybeSingle();
  if (!membership?.company_id) throw new Error("Company membership required.");
  return { supabase, userId: user.id, companyId: membership.company_id };
}

export async function setAlertState(formData: FormData) {
  const alertKey = String(formData.get("alertKey") || "");
  const sourceType = String(formData.get("sourceType") || "");
  const sourceId = String(formData.get("sourceId") || "");
  const action = String(formData.get("action") || "");
  if (!alertKey || !sourceType || !sourceId) return;
  const { supabase, userId, companyId } = await identity();
  const now = new Date();
  let status = "active";
  let snoozedUntil: string | null = null;
  let acknowledgedAt: string | null = null;
  let dismissedAt: string | null = null;
  if (action.startsWith("snooze:")) {
    status = "snoozed";
    const days = Math.max(1, Math.min(30, Number(action.split(":")[1]) || 1));
    snoozedUntil = new Date(now.getTime() + days * 86400000).toISOString();
  } else if (action === "acknowledge") {
    status = "acknowledged";
    acknowledgedAt = now.toISOString();
  } else if (action === "dismiss") {
    status = "dismissed";
    dismissedAt = now.toISOString();
  }
  const { error } = await supabase.from("action_alert_states").upsert({ user_id: userId, company_id: companyId, alert_key: alertKey, source_type: sourceType, source_id: sourceId, status, snoozed_until: snoozedUntil, acknowledged_at: acknowledgedAt, dismissed_at: dismissedAt, updated_at: now.toISOString() }, { onConflict: "user_id,company_id,alert_key" });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/action-center");
}
