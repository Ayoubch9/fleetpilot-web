import AppShell from "@/components/app-shell";
import { getFleetPilotAccount } from "@/lib/fleetpilot-account";
import SettingsCenter from "./settings-center";

export default async function SettingsPage() {
  const {
    supabase,
    user,
    fullName,
    avatarUrl,
    companyName,
    role,
  } = await getFleetPilotAccount();

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const companyResult = membership?.company_id
    ? await supabase
        .from("companies")
        .select(
          "name, legal_name, dot_number, mc_number, phone, email, address_line1, address_line2, city, state, postal_code, country, timezone"
        )
        .eq("id", membership.company_id)
        .maybeSingle()
    : { data: null, error: null };

  const companyProfileReady = !Boolean(
    companyResult.error &&
      /column .*legal_name.* does not exist|could not find.*legal_name|schema cache/i.test(
        companyResult.error.message
      )
  );

  const preferencesResult = await supabase
    .from("user_preferences")
    .select(
      "language, currency, date_format, distance_unit, time_format, week_start, default_period, timezone, compact_tables, notify_load_updates, notify_maintenance, notify_weekly_summary, notify_product_updates"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const deletionResult = await supabase
    .from("account_deletion_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  const billingResult = membership?.company_id
    ? await supabase
        .from("billing_customers")
        .select(
          "subscription_status, current_period_end, trial_started_at, trial_ends_at, plan_name, created_at"
        )
        .eq("company_id", membership.company_id)
        .maybeSingle()
    : { data: null, error: null };

  const billingStorageReady = !Boolean(
    billingResult.error &&
      /column .*trial_started_at.* does not exist|column .*trial_ends_at.* does not exist|could not find.*trial_started_at|schema cache/i.test(
        billingResult.error.message
      )
  );

  const fallbackTrialStart = user.created_at;
  const fallbackTrialEnd = new Date(
    new Date(fallbackTrialStart).getTime() + 14 * 24 * 60 * 60 * 1000
  ).toISOString();

  const subscriptionInfo = {
    planName: billingResult.data?.plan_name || "FleetPilot Pro",
    status: billingResult.data?.subscription_status || "trialing",
    trialStartedAt:
      billingResult.data?.trial_started_at ||
      billingResult.data?.created_at ||
      fallbackTrialStart,
    trialEndsAt:
      billingResult.data?.trial_ends_at ||
      fallbackTrialEnd,
    currentPeriodEnd: billingResult.data?.current_period_end || null,
    storageReady: billingStorageReady,
  };

  const preferencesReady = !Boolean(
    preferencesResult.error &&
      /relation .*user_preferences.* does not exist|could not find the table|column .*time_format.* does not exist|could not find.*time_format|schema cache/i.test(
        preferencesResult.error.message
      )
  );

  return (
    <AppShell
      active="settings"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-tool-page">
        <div className="fp-tool-heading">
          <div>
            <h1>Settings</h1>
            <p>Manage your FleetPilot account, company, preferences and security.</p>
          </div>
        </div>

        <SettingsCenter
          userId={user.id}
          companyId={membership?.company_id || ""}
          fullName={fullName}
          avatarUrl={avatarUrl}
          email={user.email || ""}
          companyName={companyName || ""}
          role={role || ""}
          initialCompanyProfile={
            companyProfileReady ? companyResult.data : null
          }
          companyProfileReady={companyProfileReady}
          initialPreferences={preferencesResult.data}
          preferencesReady={preferencesReady}
          deletionPending={Boolean(deletionResult.data?.id)}
          subscriptionInfo={subscriptionInfo}
        />
      </div>
    </AppShell>
  );
}
