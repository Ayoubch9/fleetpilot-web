import type { SupabaseClient } from "@supabase/supabase-js";

export const PUBLIC_BETA_ENV = "MILEVOXA_PUBLIC_BETA";

export type MileVoxaAccessEntitlement = {
  publicBeta: boolean;
  allowed: boolean;
  reason: "public_beta" | "paid" | "trial" | "inactive" | "unknown";
  subscriptionStatus: string | null;
  paidActive: boolean;
  trialActive: boolean;
};

export function isPublicBetaEnabled() {
  const raw = process.env[PUBLIC_BETA_ENV];
  if (raw == null || raw === "") return true;
  return !["0", "false", "off", "no"].includes(raw.toLowerCase());
}

export function isPaidSubscriptionStatus(status?: string | null) {
  return ["active", "paid", "past_due"].includes((status || "").toLowerCase());
}

export async function getMileVoxaAccessEntitlement(
  supabase: SupabaseClient,
  companyId?: string | null,
  fallbackCreatedAt?: string | null
): Promise<MileVoxaAccessEntitlement> {
  const publicBeta = isPublicBetaEnabled();

  if (!companyId) {
    return {
      publicBeta,
      allowed: publicBeta,
      reason: publicBeta ? "public_beta" : "unknown",
      subscriptionStatus: null,
      paidActive: false,
      trialActive: false,
    };
  }

  const { data, error } = await supabase
    .from("billing_customers")
    .select("subscription_status, trial_ends_at, current_period_end")
    .eq("company_id", companyId)
    .maybeSingle();

  // Billing storage may not exist on older installs. Public beta remains a
  // centrally controlled entitlement and does not depend on legacy trial rows.
  if (error) {
    return {
      publicBeta,
      allowed: publicBeta,
      reason: publicBeta ? "public_beta" : "unknown",
      subscriptionStatus: null,
      paidActive: false,
      trialActive: false,
    };
  }

  const status = data?.subscription_status || null;
  const paidActive = isPaidSubscriptionStatus(status);
  const trialEnd = data?.trial_ends_at
    ? new Date(data.trial_ends_at)
    : fallbackCreatedAt
      ? new Date(new Date(fallbackCreatedAt).getTime() + 14 * 86400000)
      : null;
  const trialActive = !paidActive && Boolean(trialEnd && trialEnd.getTime() > Date.now());

  if (publicBeta) {
    return {
      publicBeta,
      allowed: true,
      reason: "public_beta",
      subscriptionStatus: status,
      paidActive,
      trialActive,
    };
  }

  if (paidActive) {
    return {
      publicBeta,
      allowed: true,
      reason: "paid",
      subscriptionStatus: status,
      paidActive,
      trialActive: false,
    };
  }

  if (trialActive) {
    return {
      publicBeta,
      allowed: true,
      reason: "trial",
      subscriptionStatus: status,
      paidActive: false,
      trialActive: true,
    };
  }

  return {
    publicBeta,
    allowed: false,
    reason: "inactive",
    subscriptionStatus: status,
    paidActive: false,
    trialActive: false,
  };
}
