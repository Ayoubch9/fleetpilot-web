import AppShell from "@/components/app-shell";
import { getFleetPilotAccount } from "@/lib/fleetpilot-account";
import SettingsProfileForm from "./settings-profile-form";

export default async function SettingsPage() {
  const { user, fullName, companyName, role } = await getFleetPilotAccount();

  return (
    <AppShell active="settings" fullName={fullName} companyName={companyName} role={role}>
      <div className="fp-tool-page">
        <div className="fp-tool-heading"><div><h1>Settings</h1></div></div>

        <div className="fp-tabs-row settings-tabs">
          <span className="active">Profile</span>
          <span>Company</span>
          <span>Preferences</span>
          <span>Notifications</span>
          <span>Subscription</span>
          <span>Data & Export</span>
          <span>Security</span>
        </div>

        <div className="fp-settings-layout">
          <SettingsProfileForm
            userId={user.id}
            fullName={fullName}
            email={user.email || ""}
            companyName={companyName || ""}
            role={role || ""}
          />
        </div>
      </div>
    </AppShell>
  );
}
