export const LOAD_LINK_EXEMPT_CATEGORIES = new Set([
  "Insurance",
  "Permits",
  "Driver Pay",
  "Truck Payment",
  "Trailer",
]);

export function expenseRequiresLoad(category?: string | null) {
  const normalized = (category || "").trim();
  if (!normalized) return true;
  return !LOAD_LINK_EXEMPT_CATEGORIES.has(normalized);
}

export function expenseLoadLinkMessage(category?: string | null) {
  if (expenseRequiresLoad(category)) {
    return "Load ID is required for this expense. Linking it to the correct load keeps load profit accurate.";
  }

  return "This is a company-level cost, so a Load ID is optional.";
}
