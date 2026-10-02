export const DOCUMENT_TYPES = [
  "Registration / Cab Card",
  "Annual Inspection",
  "Insurance / COI",
  "Lease / Rental Agreement",
  "Permit / Tax Credential",
  "IFTA",
  "HUT",
  "Maintenance",
  "DOT / Compliance",
  "Business",
  "Other",
] as const;

export const TRUCK_PACK_TYPES = [
  "Registration / Cab Card",
  "Annual Inspection",
  "Insurance / COI",
  "Lease / Rental Agreement",
  "Permit / Tax Credential",
] as const;

export type DocumentStatus = "Valid" | "Expiring Soon" | "Expired";

export function documentStatus(expirationDate?: string | null, now=new Date()): DocumentStatus {
  if (!expirationDate) return "Valid";
  const exp=new Date(`${expirationDate}T12:00:00`);
  const soon=new Date(now.getTime()+30*86400000);
  if (exp < now) return "Expired";
  if (exp <= soon) return "Expiring Soon";
  return "Valid";
}
