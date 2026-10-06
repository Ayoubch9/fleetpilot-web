import type { SupabaseClient } from "@supabase/supabase-js";
import { getMileVoxaAlerts } from "@/lib/fleetpilot-alerts";

export type ActionSeverity = "critical" | "warning" | "attention";
export type ActionAlert = {
  key: string;
  sourceType: "maintenance" | "documents" | "loads";
  sourceId: string;
  severity: ActionSeverity;
  title: string;
  description: string;
  context: string;
  href: string;
  truckLabel?: string | null;
  state?: "active" | "snoozed" | "acknowledged" | "dismissed";
  snoozedUntil?: string | null;
};

type AlertState = {
  alert_key: string;
  status: ActionAlert["state"];
  snoozed_until: string | null;
};

function contextFromDescription(description: string, category: ActionAlert["sourceType"]) {
  const truck = description.match(/Truck #([^\s,.]+)/i)?.[1];
  return { context: truck ? `Truck ${truck}` : category === "documents" ? "Company / Compliance" : category === "loads" ? "Upcoming Load" : "Fleet Maintenance", truckLabel: truck || null };
}

export async function getActionCenterAlerts(supabase: SupabaseClient): Promise<{ alerts: ActionAlert[]; errors: unknown[]; stateAvailable: boolean }> {
  const [baseAlerts, statesResult] = await Promise.all([
    getMileVoxaAlerts(supabase),
    supabase.from("action_alert_states").select("alert_key, status, snoozed_until"),
  ]);
  const stateAvailable = !statesResult.error;
  const states = new Map(((statesResult.data ?? []) as AlertState[]).map((row) => [row.alert_key, row]));
  const now = new Date();
  const alerts = baseAlerts.map((base) => {
    const state = states.get(base.id);
    const meta = contextFromDescription(base.description, base.category);
    return {
      key: base.id,
      sourceType: base.category,
      sourceId: base.id,
      severity: base.severity === "info" ? "attention" as const : base.severity,
      title: base.title,
      description: base.description,
      context: meta.context,
      href: base.href,
      truckLabel: meta.truckLabel,
      state: state?.status || "active" as const,
      snoozedUntil: state?.snoozed_until || null,
    };
  }).filter((alert) => {
    const snoozed = alert.state === "snoozed" && alert.snoozedUntil && new Date(alert.snoozedUntil) > now;
    if (snoozed) return false;
    if (alert.severity === "critical") return true;
    return alert.state !== "dismissed" && alert.state !== "acknowledged";
  });
  return { alerts, errors: [], stateAvailable };
}
