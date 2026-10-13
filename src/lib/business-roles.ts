export const BUSINESS_ROLES = [
  "Owner Operator",
  "Lease Contractor",
  "Company Driver",
  "Fleet Owner",
  "Dispatcher",
  "Other",
] as const;

export type BusinessRole = (typeof BUSINESS_ROLES)[number];

export function isBusinessRole(value: unknown): value is BusinessRole {
  return typeof value === "string" && BUSINESS_ROLES.some((role) => role === value);
}
