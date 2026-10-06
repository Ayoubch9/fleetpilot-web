import { createHash } from "node:crypto";
import { expenseCategoryKey } from "./expense-taxonomy";
// JSON-only contract shared by the web UI/API and future mobile clients.
export type Severity = "critical" | "warning" | "attention";
export type AlertSource = "maintenance" | "documents" | "expenses" | "settlement";
export type ActionAlert = {
  id: string; source: AlertSource; sourceId: string; severity: Severity;
  title: string; explanation: string; truckId: string | null; context: string;
  href: string; actionLabel: string; fingerprint: string; sortDate: string;
};
export type Interaction = {
  alert_key: string; source: AlertSource; truck_id: string | null;
  fingerprint: string; action: "snooze" | "acknowledge" | "dismiss";
  snoozed_until: string | null; updated_at: string; resolved_at: string | null;
};
export type Truck = { id: string; unit_number: string | null; current_mileage: number | string | null };
export type Maintenance = { id: string; truck_id: string | null; service_type: string | null; service_date: string | null; next_service_date: string | null; next_service_mileage: number | string | null };
export type Document = { id: string; truck_id: string | null; name: string | null; document_type: string | null; expiration_date: string | null };
export type Expense = { id: string; truck_id: string | null; category: string | null; expense_date: string | null; amount: number | string | null; gallons: number | string | null; fuel_price_per_gallon: number | string | null };
export type Odometer = { truck_id: string | null; week_start: string | null; start_odometer: number | string | null; end_odometer: number | string | null };
export type Sources = { trucks: Truck[]; maintenance: Maintenance[]; documents: Document[]; expenses: Expense[]; settlement: Odometer[] };
const DAY = 86400000;
export function companyDate(now: Date, timeZone: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
    const values = new Map(parts.map(p=>[p.type,p.value]));
    return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
  } catch { return null; }
}
export function numeric(value: unknown): number | null {
  if (value == null || value === "") return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}
export function dateMs(value: string | null): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const result = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(result) && new Date(result).toISOString().slice(0, 10) === value ? result : null;
}
export function deriveAlerts(data: Sources, today: string, diagnostics: string[] = []): ActionAlert[] {
  const now = dateMs(today);
  if (now == null) return [];
  const trucks = new Map(data.trucks.map(t => [t.id, t]));
  const context = (id: string | null) => id ? (trucks.get(id)?.unit_number ? `Truck ${trucks.get(id)!.unit_number}` : "Truck") : "Company";
  const alerts: ActionAlert[] = [];
  const add = (source: AlertSource, sourceId: string, truckId: string | null, severity: Severity, title: string, explanation: string, href: string, fingerprint: string, sortDate = today) => alerts.push({ id: `${source}:${sourceId}`, source, sourceId, truckId, severity, title, explanation, context: context(truckId), href, fingerprint: `${severity}:${createHash("sha256").update(fingerprint).digest("hex")}`, sortDate, actionLabel: source === "settlement" ? "Fix odometer" : "View" });
  // A performed service replaces the older schedule for the same truck/service.
  // Ambiguous same-day schedules are skipped rather than arbitrarily choosing one.
  const groups = new Map<string, Maintenance[]>();
  for (const row of data.maintenance) {
    const key = row.truck_id && row.service_type ? `${row.truck_id}:${row.service_type.trim().toLowerCase()}` : row.id;
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  for (const rows of groups.values()) {
    rows.sort((a,b) => (b.service_date || "").localeCompare(a.service_date || ""));
    const row = rows[0];
    if (rows.length > 1 && (!row.service_date || row.service_date === rows[1].service_date)) {
      diagnostics.push("maintenance");
      continue;
    }
    const due = dateMs(row.next_service_date);
    const days = due == null ? null : Math.round((due - now) / DAY);
    const mileage = numeric(row.next_service_mileage);
    const current = row.truck_id ? numeric(trucks.get(row.truck_id)?.current_mileage) : null;
    const remaining = mileage == null || current == null || mileage < 0 || current < 0 ? null : mileage - current;
    const critical = (days != null && days < 0) || (remaining != null && remaining < 0);
    if (!critical && !(days != null && days <= 14) && !(remaining != null && remaining <= 1000)) continue;
    const details = [days == null ? "" : days < 0 ? `Due ${-days} days ago` : `Due in ${days} days`, remaining == null ? "" : remaining < 0 ? `${Math.round(-remaining).toLocaleString("en-US")} miles overdue` : `${Math.round(remaining).toLocaleString("en-US")} miles remaining`].filter(Boolean).join(" · ");
    add("maintenance", row.id, row.truck_id, critical ? "critical" : "warning", `${row.service_type || "Maintenance"} ${critical ? "overdue" : "due soon"}`, details, `/maintenance?${new URLSearchParams({truck: row.truck_id || "all", q: row.service_type || ""})}`, `${row.next_service_date}:${row.next_service_mileage}`, row.next_service_date || today);
  }
  for (const row of data.documents) {
    const expiry = dateMs(row.expiration_date);
    if (expiry == null) continue;
    const days = Math.round((expiry-now)/DAY);
    if (days > 30) continue;
    add("documents", row.id, row.truck_id, days < 0 ? "critical" : "warning", `${row.name || row.document_type || "Document"} ${days < 0 ? "expired" : "expires soon"}`, days < 0 ? `Expired ${-days} days ago` : `Expires in ${days} days`, `/documents?focus=${encodeURIComponent(row.id)}`, row.expiration_date!, row.expiration_date!);
  }
  // Compare individual purchases in the same truck/category. Never infer MPG
  // from unrelated load miles or compare incomplete weeks' total spend.
  const purchases = new Map<string, Expense[]>();
  for (const row of data.expenses) {
    if (!row.truck_id || !row.category) continue;
    const key = `${row.truck_id}:${row.category}`;
    const group = purchases.get(key) || [];
    group.push(row);
    purchases.set(key, group);
  }
  for (const row of data.expenses) {
    const date = dateMs(row.expense_date);
    const amount = numeric(row.amount);
    if (date == null || date > now || date < now-7*DAY || amount == null || amount <= 0 || !row.category || !row.truck_id) continue;
    const fuel = row.category === "Fuel";
    const metric = (e: Expense) => {
      const cost = numeric(e.amount), gallons = numeric(e.gallons), price = numeric(e.fuel_price_per_gallon);
      if (!fuel) return cost != null && cost > 0 ? cost : null;
      if (cost == null || gallons == null || gallons <= 0 || cost <= 0) return null;
      const actual = cost/gallons;
      return price == null || Math.abs(actual-price) <= 0.1 ? actual : null;
    };
    const history = (purchases.get(`${row.truck_id}:${row.category}`) || []).filter(e => dateMs(e.expense_date) != null && dateMs(e.expense_date)! < date && dateMs(e.expense_date)! >= date-90*DAY);
    const values = history.map(metric).filter((v): v is number => v != null).sort((a,b) => a-b);
    if (values.length < 12 || new Set(history.filter(e => metric(e) != null).map(e => e.expense_date!.slice(0,7))).size < 2) continue;
    const median = (v: number[]) => (v[Math.floor((v.length-1)/2)]+v[Math.floor(v.length/2)])/2;
    const baseline = median(values), mad = median(values.map(v => Math.abs(v-baseline)).sort((a,b) => a-b));
    const value = metric(row);
    if (value == null || value <= baseline*(fuel ? 1.5 : 3) || value-baseline <= Math.max(6*mad, fuel ? 1 : 250)) continue;
    add("expenses", row.id, row.truck_id, "attention", fuel ? "Unusual fuel price" : `Unusual ${row.category.toLowerCase()} expense`, fuel ? `$${value.toFixed(2)}/gal versus $${baseline.toFixed(2)}/gal median across ${values.length} earlier purchases. Review for accuracy.` : `$${amount.toFixed(2)} versus $${baseline.toFixed(2)} median across ${values.length} earlier purchases. Review for accuracy.`, `/expenses?${new URLSearchParams({truck: row.truck_id, dateFrom: row.expense_date!, dateTo: row.expense_date!, category: expenseCategoryKey(row.category)})}`, `${row.expense_date}:${row.amount}:${row.gallons}`, row.expense_date!);
  }
  for (const row of data.settlement) {
    const week = dateMs(row.week_start), start = numeric(row.start_odometer), end = numeric(row.end_odometer);
    if (!row.truck_id || week == null || week+8*DAY > now || week < now-90*DAY || start == null || start < 0 || (end != null && end >= start)) continue;
    const id = `${row.truck_id}:${row.week_start}`;
    add("settlement", id, row.truck_id, "warning", "Settlement mileage incomplete", end == null ? `Week ${row.week_start}: ending odometer is missing; mileage-based fees need review.` : `Week ${row.week_start}: ending odometer is below the starting reading; mileage-based fees need review.`, `/odometer?week=${row.week_start}`, `${start}:${end}`, row.week_start!);
  }
  const ranks = { critical: 0, warning: 1, attention: 2 };
  return alerts.sort((a,b) => ranks[a.severity]-ranks[b.severity] || a.sortDate.localeCompare(b.sortDate) || a.id.localeCompare(b.id));
}
export function partitionAlerts(alerts: ActionAlert[], state: Interaction[], now: Date) {
  const byId = new Map(state.map(s => [s.alert_key,s]));
  const active: ActionAlert[] = [], snoozed: ActionAlert[] = [], acknowledged: ActionAlert[] = [];
  for (const alert of alerts) {
    const interaction = byId.get(alert.id);
    const matches = !interaction?.resolved_at && interaction?.fingerprint === alert.fingerprint;
    if (matches && interaction.action === "snooze" && interaction.snoozed_until) {
      const remaining = Date.parse(interaction.snoozed_until)-now.getTime();
      if (remaining > 0 && (alert.severity !== "critical" || remaining <= DAY)) { snoozed.push(alert); continue; }
    }
    if (matches && (interaction.action === "dismiss" || interaction.action === "acknowledge") && alert.severity === "attention") { acknowledged.push(alert); continue; }
    active.push(alert);
  }
  return { active, snoozed, acknowledged };
}
