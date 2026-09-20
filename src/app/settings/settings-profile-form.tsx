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
  const [billingBusy, setBillingBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

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
    anchor.download = "milevoxa-account-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }


async function billingAction(mode: "checkout" | "portal") {
  setBillingBusy(true);
  setMessage("");

  try {
    const response = await fetch(`/api/billing/${mode}`, {
      method: "POST",
    });
    const payload = await response.json();

    if (!response.ok || !payload?.url) {
      throw new Error(payload?.error || "Billing is unavailable.");
    }

    window.location.href = payload.url;
  } catch (caught) {
    setMessage(
      caught instanceof Error ? caught.message : "Billing is unavailable."
    );
    setBillingBusy(false);
  }
}

async function requestDeletion() {
  setDeleteBusy(true);
  setMessage("");

  try {
    const response = await fetch("/api/account/delete-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        confirmation: deleteConfirmation,
        reason: deleteReason,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || "Could not submit deletion request.");
    }

    setMessage(payload.message || "Deletion request submitted.");
    setDeleteOpen(false);
    setDeleteConfirmation("");
    setDeleteReason("");
  } catch (caught) {
    setMessage(
      caught instanceof Error
        ? caught.message
        : "Could not submit deletion request."
    );
  } finally {
    setDeleteBusy(false);
  }
}

  return (
    <>
      <section className="fp-panel fp-settings-main-card">
        <h2>Profile Information</h2>

        <div className="fp-settings-profile">
          <div className="fp-settings-avatar">{name?.[0]?.toUpperCase() || "F"}</div>
          <span className="fp-settings-avatar-note">MileVoxa account</span>
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
          <button className="fp-side-action" disabled={billingBusy} onClick={() => billingAction("portal")}>▣ <span>Manage Subscription</span><b>›</b></button>
          <button className="fp-side-action" disabled={billingBusy} onClick={() => billingAction("checkout")}>▣ <span>Start / Upgrade Plan</span><b>›</b></button>
          <button className="fp-side-action" onClick={exportProfile}>▣ <span>Export Your Data</span><b>›</b></button>
          <button className="fp-side-action danger" onClick={() => setDeleteOpen(true)}>▣ <span>Delete Account</span><b>›</b></button>
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

{deleteOpen && (
  <div className="fp-delete-overlay" role="dialog" aria-modal="true">
    <div className="fp-delete-modal">
      <h2>Request Account Deletion</h2>
      <p>
        This sends a deletion request for review. It does not immediately remove your company data or account.
      </p>

      <label>
        Optional reason
        <textarea
          rows={3}
          value={deleteReason}
          onChange={(event) => setDeleteReason(event.target.value)}
          placeholder="Why are you leaving?"
        />
      </label>

      <label>
        Type DELETE to confirm
        <input
          value={deleteConfirmation}
          onChange={(event) => setDeleteConfirmation(event.target.value)}
          placeholder="DELETE"
        />
      </label>

      <div className="fp-delete-actions">
        <button
          type="button"
          onClick={() => setDeleteOpen(false)}
          disabled={deleteBusy}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={deleteBusy || deleteConfirmation !== "DELETE"}
          onClick={requestDeletion}
        >
          {deleteBusy ? "Submitting..." : "Submit Deletion Request"}
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}
