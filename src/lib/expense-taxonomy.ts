import { CHART_PALETTE } from "@/lib/chart-palette";

export const EXPENSE_TAXONOMY = [
  { key: "fuel", label: "Fuel", color: CHART_PALETTE.green },
  { key: "maintenance", label: "Maintenance", color: CHART_PALETTE.purple },
  { key: "tolls", label: "Tolls", color: CHART_PALETTE.amber },
  { key: "insurance", label: "Insurance", color: CHART_PALETTE.red },
  { key: "other", label: "Other", color: CHART_PALETTE.gray },
] as const;

export type ExpenseTaxonomyKey = (typeof EXPENSE_TAXONOMY)[number]["key"];
export type ExpenseTaxonomyLabel = (typeof EXPENSE_TAXONOMY)[number]["label"];

export function expenseCategoryKey(
  category?: string | null
): ExpenseTaxonomyKey {
  const key = (category || "Other").trim().toLowerCase();

  if (key.includes("fuel")) return "fuel";
  if (
    key.includes("maintenance") ||
    key.includes("repair") ||
    key.includes("service") ||
    key.includes("tire") ||
    key.includes("brake")
  ) {
    return "maintenance";
  }
  if (key.includes("toll")) return "tolls";
  if (key.includes("insurance") || key.includes("bobtail")) return "insurance";

  return "other";
}

export function expenseCategoryDefinition(category?: string | null) {
  const key = expenseCategoryKey(category);
  return EXPENSE_TAXONOMY.find((item) => item.key === key)!;
}

export function expenseCategoryLabel(
  category?: string | null
): ExpenseTaxonomyLabel {
  return expenseCategoryDefinition(category).label;
}

export function summarizeExpenseCategories<T>(
  rows: T[],
  categoryOf: (row: T) => string | null | undefined,
  amountOf: (row: T) => number
) {
  const totals = new Map<ExpenseTaxonomyKey, number>(
    EXPENSE_TAXONOMY.map((item) => [item.key, 0])
  );

  for (const row of rows) {
    const key = expenseCategoryKey(categoryOf(row));
    totals.set(key, (totals.get(key) || 0) + amountOf(row));
  }

  return EXPENSE_TAXONOMY.map((item) => ({
    ...item,
    amount: totals.get(item.key) || 0,
  }));
}
