import { dbDate, monday, parseDate, weekEnd } from "@/lib/fleetpilot-week";
import {
  calculateWeekFinance,
  type LedgerExpense,
  type LedgerFixedExpense,
  type LedgerLoad,
  type LedgerOdometer,
  type LedgerReimbursement,
  type LedgerSettings,
} from "@/lib/week-finance";

export type SettlementHistoryMetric = {
  weekStart: string;
  weekEnd: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  miles: number;
  profitMargin: number | null;
  citation: string;
};

function weekKey(value?: string | null) {
  const date = parseDate(value);
  return date ? dbDate(monday(date)) : null;
}

function weekLabel(startText: string) {
  const start = parseDate(startText);
  if (!start) return startText;
  const end = weekEnd(start);
  const label = `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} – ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
  return label;
}

export function buildSettlementHistory({
  loads,
  expenses,
  reimbursements,
  fixedExpenses,
  odometers,
  settings,
  maxWeeks = 52,
}: {
  loads: LedgerLoad[];
  expenses: LedgerExpense[];
  reimbursements: LedgerReimbursement[];
  fixedExpenses: LedgerFixedExpense[];
  odometers: Array<LedgerOdometer & { week_start?: string | null }>;
  settings?: LedgerSettings;
  maxWeeks?: number;
}): SettlementHistoryMetric[] {
  const weekStarts = new Set<string>();

  for (const row of loads) {
    const key = weekKey(row.pickup_date);
    if (key) weekStarts.add(key);
  }
  for (const row of expenses) {
    const key = weekKey(row.expense_date);
    if (key) weekStarts.add(key);
  }
  for (const row of reimbursements) {
    const key = weekKey(row.reimbursement_date);
    if (key) weekStarts.add(key);
  }
  for (const row of odometers) {
    const key = weekKey(row.week_start);
    if (key) weekStarts.add(key);
  }

  return [...weekStarts]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, maxWeeks)
    .map((startText) => {
      const finance = calculateWeekFinance({
        loads: loads.filter((row) => weekKey(row.pickup_date) === startText),
        expenses: expenses.filter(
          (row) => weekKey(row.expense_date) === startText
        ),
        reimbursements: reimbursements.filter(
          (row) => weekKey(row.reimbursement_date) === startText
        ),
        fixedExpenses,
        odometers: odometers.filter(
          (row) => weekKey(row.week_start) === startText
        ),
        settings,
      });

      const start = parseDate(startText)!;
      const endText = dbDate(weekEnd(start));

      return {
        weekStart: startText,
        weekEnd: endText,
        revenue: finance.grossRevenue,
        expenses: finance.totalExpenses,
        netProfit: finance.netProfit,
        miles: finance.totalMiles,
        profitMargin: finance.profitMargin,
        citation: `Based on your MileVoxa settlements — ${weekLabel(startText)}`,
      };
    });
}
