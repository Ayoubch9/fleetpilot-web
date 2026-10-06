import AppShell from "@/components/app-shell";
import { ActionCenterCard } from "@/components/action-center-card";
import { getActionCenterAlerts } from "@/lib/action-center";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";

export default async function ActionCenterPage({ searchParams }: { searchParams: Promise<{ severity?: string; truck?: string }> }) {
  const params = await searchParams;
  const { supabase, fullName, companyName, role } = await getMileVoxaAccount();
  const result = await getActionCenterAlerts(supabase);
  const severity = (params.severity || "all").toLowerCase();
  const truck = params.truck || "all";
  const truckOptions = [...new Set(result.alerts.map((a) => a.truckLabel).filter((value): value is string => Boolean(value)))].sort();
  const alerts = result.alerts.filter((a) => (severity === "all" || a.severity === severity) && (truck === "all" || a.truckLabel === truck));
  return <AppShell active="overview" fullName={fullName} companyName={companyName} role={role}><div className="fp-tool-page fp-action-page">
    <div className="fp-tool-heading"><div><h1>Action Center</h1><p>One place for the maintenance and compliance items that need attention across your business.</p></div></div>
    <form className="fp-action-filters" method="get"><label>Severity<select name="severity" defaultValue={severity}><option value="all">All</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="attention">Attention</option></select></label><label>Truck<select name="truck" defaultValue={truck}><option value="all">All Trucks</option>{truckOptions.map((label) => <option key={label} value={label}>{`Truck ${label}`}</option>)}</select></label><button type="submit">Apply Filters</button></form>
    {result.errors.length > 0 && <div className="fp-action-setup">Some Action Center sources could not be loaded. Available alerts are still shown.</div>}
    <ActionCenterCard alerts={alerts} stateAvailable={result.stateAvailable}/>
  </div></AppShell>;
}
