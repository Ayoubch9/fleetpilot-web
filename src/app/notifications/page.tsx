import AppShell from "@/components/app-shell";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";
import { getMileVoxaAlerts } from "@/lib/fleetpilot-alerts";
import NotificationCenter from "./notification-center";

export default async function NotificationsPage() {
  const { supabase, fullName, companyName, role } =
    await getMileVoxaAccount();

  const alerts = await getMileVoxaAlerts(supabase);

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
              Operational alerts generated from your real MileVoxa data.
            </p>
          </div>
        </div>

        <NotificationCenter alerts={alerts} />
      </div>
    </AppShell>
  );
}
