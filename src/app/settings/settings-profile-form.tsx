"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsProfileForm({
  userId,
  fullName,
  email,
  companyName,
  role,
}: {
  userId: string;
  fullName: string;
  email: string;
  companyName: string;
  role: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim() })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Profile updated.");
    router.refresh();
  }

  async function resetPassword() {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setMessage(error ? error.message : "Password reset email sent.");
  }

  function exportProfile() {
    const payload = {
      fullName: name,
      email,
      company: companyName,
      role,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "fleetpilot-account-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <section className="fp-panel fp-settings-main-card">
        <h2>Profile Information</h2>

        <div className="fp-settings-profile">
          <div className="fp-settings-avatar">{name?.[0]?.toUpperCase() || "F"}</div>
          <span className="fp-settings-avatar-note">FleetPilot account</span>
        </div>

        <form onSubmit={save}>
          <label>
            Full Name
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label>
            Email
            <input value={email} readOnly />
          </label>

          <div className="fp-settings-grid">
            <label>
              Company
              <input value={companyName} readOnly />
            </label>

            <label>
              Role
              <input value={role} readOnly />
            </label>
          </div>

          {message && <div className="fp-settings-message">{message}</div>}

          <button className="fp-primary-btn settings-save" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </section>

      <aside className="fp-right-stack">
        <section className="fp-panel side">
          <h2>Quick Actions</h2>
          <button className="fp-side-action" onClick={resetPassword}>▣ <span>Change Password</span><b>›</b></button>
          <button className="fp-side-action">▣ <span>Manage Subscription</span><b>›</b></button>
          <button className="fp-side-action" onClick={exportProfile}>▣ <span>Export Your Data</span><b>›</b></button>
          <button className="fp-side-action" disabled>▣ <span>Delete Account</span><b>›</b></button>
        </section>

        <section className="fp-panel side">
          <h2>App Preferences</h2>
          <div className="fp-pref-row"><span>Theme</span><div className="fp-theme-toggle"><b>Light</b><span>Dark</span><span>System</span></div></div>
          <div className="fp-pref-row"><span>Language</span><button>English⌄</button></div>
          <div className="fp-pref-row"><span>Currency</span><button>USD ($)⌄</button></div>
          <div className="fp-pref-row"><span>Date Format</span><button>Aug 31, 2026⌄</button></div>
          <div className="fp-pref-row"><span>Distance Unit</span><button>Miles⌄</button></div>
          <button className="fp-primary-btn prefs-save" type="button">Save Preferences</button>
        </section>
      </aside>
    </>
  );
}
