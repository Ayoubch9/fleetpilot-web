import AppShell from "@/components/app-shell";
import { getFleetPilotAccount } from "@/lib/fleetpilot-account";
import { getFleetPilotAlerts } from "@/lib/fleetpilot-alerts";
import NotificationCenter from "./notification-center";

export default async function NotificationsPage() {
  const { supabase, fullName, companyName, role } =
    await getFleetPilotAccount();

  const alerts = await getFleetPilotAlerts(supabase);

  return (
    <AppShell
      active="notifications"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-tool-page">
        <div className="fp-tool-heading">
          <div>
            <h1>Notifications</h1>
            <p>
              Operational alerts generated from your real FleetPilot data.
            </p>
          </div>
        </div>

        <NotificationCenter alerts={alerts} />
      </div>
    </AppShell>
  );
}
