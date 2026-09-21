import { expenseCategoryLabel } from "@/lib/expense-taxonomy";
export type LedgerLoad = {
  id?: string | null;
  rate?: number | string | null;
  loaded_miles?: number | string | null;
  deadhead_miles?: number | string | null;
  pickup_date?: string | null;
  delivery_date?: string | null;
  load_number?: string | null;
  pickup?: string | null;
  delivery?: string | null;
  status?: string | null;
};

export type LedgerExpense = {
  id?: string | null;
  amount?: number | string | null;
  category?: string | null;
  expense_date?: string | null;
  vendor?: string | null;
  description?: string | null;
  truck_id?: string | null;
};

export type LedgerReimbursement = {
  id?: string | null;
  amount?: number | string | null;
  reimbursement_date?: string | null;
};

export type LedgerFixedExpense = {
  amount?: number | string | null;
  name?: string | null;
  is_active?: boolean | null;
  active?: boolean | null;
};

export type LedgerOdometer = {
  start_odometer?: number | string | null;
  end_odometer?: number | string | null;
};

export type LedgerSettings = {
  revenue_fee_percent?: number | string | null;
  mileage_fee_per_mile?: number | string | null;
  is_revenue_fee_active?: boolean | null;
  is_mileage_fee_active?: boolean | null;
};

export type LedgerMaintenance = {
  id?: string | null;
  truck_id?: string | null;
  service_type?: string | null;
  service_date?: string | null;
  vendor?: string | null;
  cost?: number | string | null;
};

export type WeekLedger = {
  loads: LedgerLoad[];
  expenses: LedgerExpense[];
  reimbursements: LedgerReimbursement[];
  fixedExpenses: LedgerFixedExpense[];
  odometers: LedgerOdometer[];
  settings?: LedgerSettings;
  maintenance?: LedgerMaintenance[];
};

export type TrendResult = {
  direction: "up" | "down" | "flat";
  percent: number;
  tone: "positive" | "negative" | "neutral";
};

export type ActivityEvent = {
  id: string;
  type: "load" | "fuel" | "maintenance" | "expense";
  text: string;
  amount: number | null;
  occurredOn: string;
};

export const EXPENSE_LEGEND_ORDER = [
  "Fuel",
  "Maintenance",
  "Tolls",
  "Insurance",
  "Other",
  "Truck Payment",
] as const;

export function numberValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function isActiveFixedExpense(item: LedgerFixedExpense): boolean {
  if (typeof item.is_active === "boolean") return item.is_active;
  if (typeof item.active === "boolean") return item.active;
  return true;
}

export function fixedExpenseCategory(name?: string | null): typeof EXPENSE_LEGEND_ORDER[number] {
  const key = (name || "").trim().toLowerCase();
  if (key.includes("insurance") || key.includes("bobtail")) return "Insurance";
  if (
    key.includes("truck rent") ||
    key.includes("truck lease") ||
    key.includes("truck payment") ||
    key.includes("tractor payment")
  ) return "Truck Payment";
  if (key.includes("toll")) return "Tolls";
  if (key.includes("fuel")) return "Fuel";
  if (
    key.includes("maintenance") ||
    key.includes("repair") ||
    key.includes("service") ||
    key.includes("tire")
  ) return "Maintenance";
  return "Other";
}

export function variableExpenseCategory(
  category?: string | null
): typeof EXPENSE_LEGEND_ORDER[number] {
  return expenseCategoryLabel(category);
}

export function calculateWeekFinance(ledger: WeekLedger) {
  const grossRevenue = ledger.loads.reduce(
    (sum, row) => sum + numberValue(row.rate),
    0
  );
  const loadedMiles = ledger.loads.reduce(
    (sum, row) => sum + numberValue(row.loaded_miles),
    0
  );
  const deadheadMiles = ledger.loads.reduce(
    (sum, row) => sum + numberValue(row.deadhead_miles),
    0
  );
  const totalMiles = loadedMiles + deadheadMiles;

  const variableExpenses = ledger.expenses.reduce(
    (sum, row) => sum + numberValue(row.amount),
    0
  );
  const reimbursementTotal = ledger.reimbursements.reduce(
    (sum, row) => sum + numberValue(row.amount),
    0
  );
  const netVariableExpenses = variableExpenses - reimbursementTotal;
  const fixedTotal = ledger.fixedExpenses
    .filter(isActiveFixedExpense)
    .reduce((sum, row) => sum + numberValue(row.amount), 0);

  const odometerMiles = ledger.odometers.reduce(
    (sum, row) =>
      sum +
      Math.max(
        numberValue(row.end_odometer) - numberValue(row.start_odometer),
        0
      ),
    0
  );

  const settings = ledger.settings;
  const revenueFeePercent =
    settings?.revenue_fee_percent == null
      ? 15
      : numberValue(settings.revenue_fee_percent);
  const mileageFeeRate =
    settings?.mileage_fee_per_mile == null
      ? 0.15
      : numberValue(settings.mileage_fee_per_mile);
  const revenueFeeActive =
    settings?.is_revenue_fee_active == null
      ? true
      : Boolean(settings.is_revenue_fee_active);
  const mileageFeeActive =
    settings?.is_mileage_fee_active == null
      ? true
      : Boolean(settings.is_mileage_fee_active);

  const revenueFee = revenueFeeActive
    ? grossRevenue * (revenueFeePercent / 100)
    : 0;
  const mileageFee = mileageFeeActive
    ? odometerMiles * mileageFeeRate
    : 0;
  const totalExpenses =
    netVariableExpenses + fixedTotal + revenueFee + mileageFee;
  const netProfit = grossRevenue - totalExpenses;

  const fuelCost = ledger.expenses
    .filter((row) => variableExpenseCategory(row.category) === "Fuel")
    .reduce((sum, row) => sum + numberValue(row.amount), 0);

  return {
    grossRevenue,
    loadedMiles,
    deadheadMiles,
    totalMiles,
    variableExpenses,
    reimbursementTotal,
    netVariableExpenses,
    fixedTotal,
    odometerMiles,
    revenueFeePercent,
    mileageFeeRate,
    revenueFee,
    mileageFee,
    totalExpenses,
    netProfit,
    revenuePerMile: totalMiles > 0 ? grossRevenue / totalMiles : 0,
    costPerMile: totalMiles > 0 ? totalExpenses / totalMiles : 0,
    profitPerMile: totalMiles > 0 ? netProfit / totalMiles : 0,
    profitMargin:
      grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : null,
    deadheadPercent:
      totalMiles > 0 ? (deadheadMiles / totalMiles) * 100 : 0,
    fuelCost,
  };
}

export function calculateTrend(
  current: number | null | undefined,
  previous: number | null | undefined
): TrendResult | null {
  if (
    current == null ||
    previous == null ||
    !Number.isFinite(current) ||
    !Number.isFinite(previous) ||
    Math.abs(previous) < 0.000001
  ) {
    return null;
  }

  const percent = ((current - previous) / Math.abs(previous)) * 100;
  const direction =
    Math.abs(percent) < 0.05 ? "flat" : percent > 0 ? "up" : "down";

  // Positive/green is only allowed for a genuinely positive current value
  // that improved. Negative or zero current values can never be green.
  const tone =
    current > 0 && direction === "up"
      ? "positive"
      : current <= 0 || direction === "down"
        ? "negative"
        : "neutral";

  return { direction, percent, tone };
}

export function buildExpenseBreakdown(ledger: WeekLedger) {
  const totals = new Map<string, number>(
    EXPENSE_LEGEND_ORDER.map((label) => [label, 0])
  );

  for (const row of ledger.expenses) {
    const category = variableExpenseCategory(row.category);
    totals.set(
      category,
      (totals.get(category) || 0) + numberValue(row.amount)
    );
  }

  for (const row of ledger.fixedExpenses.filter(isActiveFixedExpense)) {
    const category = fixedExpenseCategory(row.name);
    totals.set(
      category,
      (totals.get(category) || 0) + numberValue(row.amount)
    );
  }

  // Company fees are real operating costs but are not an Expenses-page
  // category, so keep those fee amounts in Other.
  const finance = calculateWeekFinance(ledger);
  totals.set(
    "Other",
    (totals.get("Other") || 0) + finance.revenueFee + finance.mileageFee
  );

  // Reimbursements offset expenses. Apply the recovery to Other first, then
  // to the largest remaining categories so the donut reconciles to the same
  // net Total Expenses used by Settlement/Dashboard without inventing a
  // separate "reimbursement expense" category.
  let remainingRecovery = finance.reimbursementTotal;
  const recoveryOrder = [...EXPENSE_LEGEND_ORDER].sort(
    (a, b) => (totals.get(b) || 0) - (totals.get(a) || 0)
  );
  recoveryOrder.sort((a, b) => (a === "Other" ? -1 : b === "Other" ? 1 : 0));

  for (const label of recoveryOrder) {
    if (remainingRecovery <= 0) break;
    const value = totals.get(label) || 0;
    const applied = Math.min(value, remainingRecovery);
    totals.set(label, value - applied);
    remainingRecovery -= applied;
  }

  return EXPENSE_LEGEND_ORDER.map((label) => ({
    label,
    value: totals.get(label) || 0,
  }));
}

function eventDate(value?: string | null): number {
  if (!value) return 0;
  const time = new Date(`${value.slice(0, 10)}T12:00:00`).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function buildWeekActivity(ledger: WeekLedger): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const load of ledger.loads) {
    if (!load.pickup_date) continue;
    const route = `${(load.pickup || "Unknown").trim()} → ${(load.delivery || "Unknown").trim()}`;
    events.push({
      id: `load:${load.id || load.load_number || load.pickup_date}:${route}`,
      type: "load",
      text: `Load ${
        ["completed", "delivered"].includes(
          load.status?.trim().toLowerCase() || ""
        )
          ? "completed"
          : "recorded"
      } · ${route}`,
      amount: numberValue(load.rate),
      occurredOn: load.pickup_date,
    });
  }

  for (const expense of ledger.expenses) {
    if (!expense.expense_date) continue;
    const category = variableExpenseCategory(expense.category);
    const vendor = expense.vendor?.trim();
    const isFuel = category === "Fuel";
    events.push({
      id: `expense:${expense.id || expense.expense_date}:${expense.category || "Other"}`,
      type: isFuel ? "fuel" : "expense",
      text: isFuel
        ? `Fuel purchase${vendor ? ` · ${vendor}` : ""}`
        : `Expense added · ${expense.category?.trim() || "Other"}`,
      amount: -Math.abs(numberValue(expense.amount)),
      occurredOn: expense.expense_date,
    });
  }

  for (const row of ledger.maintenance || []) {
    if (!row.service_date) continue;
    events.push({
      id: `maintenance:${row.id || row.service_date}:${row.service_type || "Service"}`,
      type: "maintenance",
      text: `Maintenance · ${row.service_type?.trim() || "Service"}${row.vendor?.trim() ? ` · ${row.vendor.trim()}` : ""}`,
      amount: -Math.abs(numberValue(row.cost)),
      occurredOn: row.service_date,
    });
  }

  return events.sort(
    (a, b) => eventDate(b.occurredOn) - eventDate(a.occurredOn)
  );
}
