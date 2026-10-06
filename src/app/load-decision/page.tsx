import AppShell from "@/components/app-shell";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";
import LoadDecisionCenter from "./load-decision-center";

export default async function LoadDecisionPage() {
  const { supabase, fullName, companyName, role } = await getMileVoxaAccount();
  const [{ data: truckData }, { data: fuelData }] = await Promise.all([
    supabase.from("trucks").select("id, unit_number, make, model, status").order("unit_number"),
    supabase.from("expenses").select("amount, gallons, fuel_price_per_gallon, category").eq("category", "Fuel").order("expense_date", { ascending: false }).limit(30),
  ]);

  const trucks = (truckData ?? []).filter((truck) => (truck.status || "").toUpperCase() !== "INACTIVE");
  const fuelRows = fuelData ?? [];
  let gallons = 0;
  let spend = 0;
  for (const row of fuelRows) {
    const g = Number(row.gallons || 0);
    const amount = Number(row.amount || 0);
    const price = Number(row.fuel_price_per_gallon || 0);
    if (g > 0) {
      gallons += g;
      spend += amount > 0 ? amount : g * price;
    }
  }
  const historicalFuelPrice = gallons > 0 ? spend / gallons : null;

  return (
    <AppShell active="decision" fullName={fullName} companyName={companyName} role={role}>
      <LoadDecisionCenter trucks={trucks} historicalFuelPrice={historicalFuelPrice} />
    </AppShell>
  );
}
