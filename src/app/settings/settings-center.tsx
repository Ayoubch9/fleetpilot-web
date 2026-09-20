"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SettingsTab =
  | "profile"
  | "company"
  | "business-costs"
  | "preferences"
  | "notifications"
  | "subscription"
  | "data"
  | "legal"
  | "security";

type SubscriptionInfo = {
  planName: string;
  status: string;
  trialStartedAt: string;
  trialEndsAt: string;
  currentPeriodEnd: string | null;
  storageReady: boolean;
};

type CompanyProfile = {
  name: string;
  legal_name: string;
  dot_number: string;
  mc_number: string;
  phone: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  timezone: string;
};

type CompanyFeeSettings = {
  id: string | null;
  company_id: string | null;
  revenue_fee_percent: number;
  mileage_fee_per_mile: number;
  is_revenue_fee_active: boolean;
  is_mileage_fee_active: boolean;
};

type FixedExpense = {
  id: string;
  company_id: string | null;
  name: string;
  amount: number;
  is_active: boolean;
};

type Preferences = {
  language: string;
  currency: string;
  date_format: string;
  distance_unit: string;
  time_format: string;
  week_start: string;
  default_period: string;
  timezone: string;
  compact_tables: boolean;
  notify_load_updates: boolean;
  notify_maintenance: boolean;
  notify_weekly_summary: boolean;
  notify_product_updates: boolean;
};

const defaultPreferences: Preferences = {
  language: "English",
  currency: "USD",
  date_format: "MMM d, yyyy",
  distance_unit: "Miles",
  time_format: "12-hour",
  week_start: "Monday",
  default_period: "Week",
  timezone: "America/New_York",
  compact_tables: false,
  notify_load_updates: true,
  notify_maintenance: true,
  notify_weekly_summary: true,
  notify_product_updates: false,
};

export default function SettingsCenter({
  userId,
  companyId,
  fullName,
  avatarUrl,
  email,
  companyName,
  role,
  initialCompanyProfile,
  companyProfileReady,
  initialPreferences,
  preferencesReady,
  initialCompanyFeeSettings,
  initialFixedExpenses,
  businessCostsReady,
  deletionPending,
  subscriptionInfo,
}: {
  userId: string;
  companyId: string;
  fullName: string;
  avatarUrl: string | null;
  email: string;
  companyName: string;
  role: string;
  initialCompanyProfile: Partial<CompanyProfile> | null;
  companyProfileReady: boolean;
  initialPreferences: Partial<Preferences> | null;
  preferencesReady: boolean;
  initialCompanyFeeSettings: Partial<CompanyFeeSettings> | null;
  initialFixedExpenses: Array<Partial<FixedExpense>>;
  businessCostsReady: boolean;
  deletionPending: boolean;
  subscriptionInfo: SubscriptionInfo;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [name, setName] = useState(fullName);
  const [avatar, setAvatar] = useState<string | null>(avatarUrl);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    name: initialCompanyProfile?.name || companyName,
    legal_name: initialCompanyProfile?.legal_name || "",
    dot_number: initialCompanyProfile?.dot_number || "",
    mc_number: initialCompanyProfile?.mc_number || "",
    phone: initialCompanyProfile?.phone || "",
    email: initialCompanyProfile?.email || "",
    address_line1: initialCompanyProfile?.address_line1 || "",
    address_line2: initialCompanyProfile?.address_line2 || "",
    city: initialCompanyProfile?.city || "",
    state: initialCompanyProfile?.state || "",
    postal_code: initialCompanyProfile?.postal_code || "",
    country: initialCompanyProfile?.country || "United States",
    timezone: initialCompanyProfile?.timezone || "America/New_York",
  });
  const [preferences, setPreferences] = useState<Preferences>({
    ...defaultPreferences,
    ...(initialPreferences || {}),
  });
  const [companyFees, setCompanyFees] = useState<CompanyFeeSettings>({
    id: initialCompanyFeeSettings?.id || null,
    company_id: initialCompanyFeeSettings?.company_id || companyId || null,
    revenue_fee_percent:
      initialCompanyFeeSettings?.revenue_fee_percent == null
        ? 15
        : Number(initialCompanyFeeSettings.revenue_fee_percent),
    mileage_fee_per_mile:
      initialCompanyFeeSettings?.mileage_fee_per_mile == null
        ? 0.15
        : Number(initialCompanyFeeSettings.mileage_fee_per_mile),
    is_revenue_fee_active:
      initialCompanyFeeSettings?.is_revenue_fee_active == null
        ? true
        : Boolean(initialCompanyFeeSettings.is_revenue_fee_active),
    is_mileage_fee_active:
      initialCompanyFeeSettings?.is_mileage_fee_active == null
        ? true
        : Boolean(initialCompanyFeeSettings.is_mileage_fee_active),
  });
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(
    initialFixedExpenses.map((row) => ({
      id: row.id || "",
      company_id: row.company_id || companyId || null,
      name: row.name || "Fixed Expense",
      amount: Number(row.amount || 0),
      is_active:
        row.is_active == null ? true : Boolean(row.is_active),
    }))
  );
  const [newFixedName, setNewFixedName] = useState("");
  const [newFixedAmount, setNewFixedAmount] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const owner = role.toLowerCase() === "owner";

  const trialStart = new Date(subscriptionInfo.trialStartedAt);
  const trialEnd = new Date(subscriptionInfo.trialEndsAt);
  const now = new Date();
  const trialDurationMs = Math.max(
    1,
    trialEnd.getTime() - trialStart.getTime()
  );
  const trialElapsedMs = Math.min(
    trialDurationMs,
    Math.max(0, now.getTime() - trialStart.getTime())
  );
  const trialProgress = Math.round(
    (trialElapsedMs / trialDurationMs) * 100
  );
  const trialDaysRemaining = Math.max(
    0,
    Math.ceil(
      (trialEnd.getTime() - now.getTime()) /
        (24 * 60 * 60 * 1000)
    )
  );
  const trialDaysUsed = Math.min(
    14,
    Math.max(0, 14 - trialDaysRemaining)
  );
  const normalizedSubscriptionStatus =
    subscriptionInfo.status.toLowerCase();
  const paidActive = [
    "active",
    "paid",
    "past_due",
  ].includes(normalizedSubscriptionStatus);
  const trialActive =
    !paidActive &&
    trialEnd.getTime() > now.getTime();
  const subscriptionLabel = paidActive
    ? "Active"
    : trialActive
      ? "Free Trial"
      : "Trial Ended";


async function uploadAvatar(file: File) {
  if (!file.type.startsWith("image/")) {
    setMessage("Choose an image file.");
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    setMessage("Avatar image must be smaller than 8 MB.");
    return;
  }

  setAvatarBusy(true);
  setMessage("");

  try {
    const jpeg = await avatarToJpeg(file);
    const supabase = createClient();
    const path = `${userId}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, jpeg, {
        upsert: true,
        contentType: "image/jpeg",
        cacheControl: "3600",
      });

    if (uploadError) throw uploadError;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_path: path })
      .eq("id", userId);

    if (profileError) throw profileError;

    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60);

    setAvatar(
      signed?.signedUrl
        ? `${signed.signedUrl}${signed.signedUrl.includes("?") ? "&" : "?"}v=${Date.now()}`
        : URL.createObjectURL(jpeg)
    );
    setMessage("Profile photo updated.");
    router.refresh();
  } catch (caught) {
    setMessage(
      caught instanceof Error
        ? caught.message
        : "Could not upload profile photo."
    );
  } finally {
    setAvatarBusy(false);
  }
}

async function removeAvatar() {
  setAvatarBusy(true);
  setMessage("");

  try {
    const supabase = createClient();
    const path = `${userId}/avatar.jpg`;

    await supabase.storage.from("avatars").remove([path]);

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_path: null })
      .eq("id", userId);

    if (error) throw error;

    setAvatar(null);
    setMessage("Profile photo removed.");
    router.refresh();
  } catch (caught) {
    setMessage(
      caught instanceof Error
        ? caught.message
        : "Could not remove profile photo."
    );
  } finally {
    setAvatarBusy(false);
  }
}

  async function saveProfile(event: FormEvent) {
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

  async function saveCompany(event: FormEvent) {
    event.preventDefault();
    if (!owner) return;

    if (!companyProfileReady) {
      setMessage(
        "Run supabase_company_preferences_setup.sql once before saving the expanded company profile."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("companies")
      .update({
        name: companyProfile.name.trim(),
        legal_name: companyProfile.legal_name.trim() || null,
        dot_number: companyProfile.dot_number.trim() || null,
        mc_number: companyProfile.mc_number.trim() || null,
        phone: companyProfile.phone.trim() || null,
        email: companyProfile.email.trim() || null,
        address_line1: companyProfile.address_line1.trim() || null,
        address_line2: companyProfile.address_line2.trim() || null,
        city: companyProfile.city.trim() || null,
        state: companyProfile.state.trim() || null,
        postal_code: companyProfile.postal_code.trim() || null,
        country: companyProfile.country.trim() || "United States",
        timezone: companyProfile.timezone,
      })
      .eq("id", companyId);

    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Company information updated.");
    router.refresh();
  }

  async function savePreferences() {
    if (!preferencesReady) {
      setMessage(
        "Run supabase_settings_setup.sql once before saving preferences."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: userId,
        company_id: companyId,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    setSaving(false);
    setMessage(error ? error.message : "Preferences saved.");
  }

  async function saveCompanyFees() {
    if (!owner || !companyId) return;

    if (!businessCostsReady) {
      setMessage(
        "Company fee settings could not be loaded from Supabase. Check the shared company tables before saving."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const supabase = createClient();
      const payload = {
        company_id: companyId,
        revenue_fee_percent: Number(companyFees.revenue_fee_percent || 0),
        mileage_fee_per_mile: Number(companyFees.mileage_fee_per_mile || 0),
        is_revenue_fee_active: companyFees.is_revenue_fee_active,
        is_mileage_fee_active: companyFees.is_mileage_fee_active,
      };

      if (companyFees.id) {
        const { error } = await supabase
          .from("company_fee_settings")
          .update(payload)
          .eq("id", companyFees.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("company_fee_settings")
          .insert(payload)
          .select("id, company_id")
          .single();

        if (error) throw error;

        setCompanyFees((current) => ({
          ...current,
          id: data.id,
          company_id: data.company_id || companyId,
        }));
      }

      setMessage(
        "Company and mileage fees saved. Mobile and web now read the same Supabase settings."
      );
      router.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Could not save company fee settings."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveFixedExpense(row: FixedExpense) {
    if (!owner || !companyId) return;

    const name = row.name.trim();
    if (!name) {
      setMessage("Fixed expense name is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const supabase = createClient();
      const payload = {
        company_id: companyId,
        name,
        amount: Number(row.amount || 0),
        is_active: row.is_active,
      };

      if (row.id) {
        const { error } = await supabase
          .from("weekly_fixed_expenses")
          .update(payload)
          .eq("id", row.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("weekly_fixed_expenses")
          .insert(payload)
          .select("id, company_id, name, amount, is_active")
          .single();

        if (error) throw error;

        setFixedExpenses((current) =>
          current.map((item) =>
            item === row
              ? {
                  id: data.id,
                  company_id: data.company_id || companyId,
                  name: data.name,
                  amount: Number(data.amount || 0),
                  is_active: Boolean(data.is_active),
                }
              : item
          )
        );
      }

      setMessage(
        `${name} saved. This fixed weekly cost is shared with the mobile app.`
      );
      router.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Could not save fixed expense."
      );
    } finally {
      setSaving(false);
    }
  }

  async function addFixedExpense() {
    if (!owner || !companyId) return;

    const name = newFixedName.trim();
    const amount = Number(newFixedAmount || 0);

    if (!name) {
      setMessage("Enter a fixed expense name.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("weekly_fixed_expenses")
        .insert({
          company_id: companyId,
          name,
          amount,
          is_active: true,
        })
        .select("id, company_id, name, amount, is_active")
        .single();

      if (error) throw error;

      setFixedExpenses((current) => [
        ...current,
        {
          id: data.id,
          company_id: data.company_id || companyId,
          name: data.name,
          amount: Number(data.amount || 0),
          is_active: Boolean(data.is_active),
        },
      ].sort((a, b) => a.name.localeCompare(b.name)));

      setNewFixedName("");
      setNewFixedAmount("");
      setMessage(
        `${name} added. It is now part of the shared weekly fixed expenses.`
      );
      router.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Could not add fixed expense."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteFixedExpense(row: FixedExpense) {
    if (!owner || !row.id) return;

    if (
      !window.confirm(
        `Delete "${row.name}" from weekly fixed expenses?`
      )
    ) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("weekly_fixed_expenses")
        .delete()
        .eq("id", row.id);

      if (error) throw error;

      setFixedExpenses((current) =>
        current.filter((item) => item.id !== row.id)
      );
      setMessage(`${row.name} deleted.`);
      router.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Could not delete fixed expense."
      );
    } finally {
      setSaving(false);
    }
  }

  function addPresetFixedExpense(name: string) {
    const exists = fixedExpenses.some(
      (row) => row.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      setMessage(`${name} already exists.`);
      return;
    }

    setNewFixedName(name);
    setNewFixedAmount("");
  }

  async function resetPassword() {
    setMessage("");
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setMessage(error ? error.message : "Password reset email sent.");
  }

  async function signOutEverywhere() {
    setSaving(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signOut({ scope: "global" });

    if (error) {
      setSaving(false);
      setMessage(error.message);
      return;
    }

    window.location.href = "/login";
  }

  async function exportAccount() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/account/export", {
        cache: "no-store",
      });
      const payload = await response.blob();

      if (!response.ok) {
        const text = await payload.text();
        throw new Error(text || "Could not export account data.");
      }

      const url = URL.createObjectURL(payload);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `milevoxa-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("MileVoxa data export created.");
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "Could not export account data."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    setDeleteBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
          reason: deleteReason,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error || "Could not delete the MileVoxa account."
        );
      }

      window.location.href = "/account-deleted?done=1";
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Could not delete the MileVoxa account."
      );
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <div className="fp-settings-tabbar">
        <TabButton label="Profile" active={tab === "profile"} onClick={() => setTab("profile")} />
        <TabButton label="Company" active={tab === "company"} onClick={() => setTab("company")} />
        <TabButton label="Business Costs" active={tab === "business-costs"} onClick={() => setTab("business-costs")} />
        <TabButton label="Preferences" active={tab === "preferences"} onClick={() => setTab("preferences")} />
        <TabButton label="Notifications" active={tab === "notifications"} onClick={() => setTab("notifications")} />
        <TabButton label="Subscription" active={tab === "subscription"} onClick={() => setTab("subscription")} />
        <TabButton label="Data & Export" active={tab === "data"} onClick={() => setTab("data")} />
        <TabButton label="Legal & Privacy" active={tab === "legal"} onClick={() => setTab("legal")} />
        <TabButton label="Security" active={tab === "security"} onClick={() => setTab("security")} />
      </div>

      {message && <div className="fp-settings-global-message">{message}</div>}

      <div className="fp-settings-control-grid">
        <main>
          {tab === "profile" && (
            <section className="fp-panel fp-settings-main-card">
              <h2>Profile Information</h2>
              <p className="fp-settings-copy">
                Manage the personal information attached to your MileVoxa account.
              </p>

              <div className="fp-settings-profile">
                <div className="fp-settings-avatar fp-settings-avatar-photo">
                  {avatar ? (
                    <img src={avatar} alt={`${name} profile`} />
                  ) : (
                    name?.[0]?.toUpperCase() || "F"
                  )}
                </div>

                <div className="fp-avatar-profile-info">
                  <strong>{name}</strong>
                  <span>{email}</span>

                  <div className="fp-avatar-actions">
                    <label className="fp-avatar-upload-button">
                      {avatarBusy ? "Uploading..." : avatar ? "Change Photo" : "Upload Photo"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={avatarBusy}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadAvatar(file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>

                    {avatar && (
                      <button
                        type="button"
                        disabled={avatarBusy}
                        onClick={() => void removeAvatar()}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <small>JPG, PNG or WebP · automatically resized</small>
                </div>
              </div>

              <form onSubmit={saveProfile}>
                <label>
                  Full Name
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
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

                <button className="fp-primary-btn settings-save" disabled={saving}>
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </section>
          )}

          {tab === "company" && (
            <section className="fp-panel fp-settings-main-card fp-company-settings">
              <div className="fp-settings-section-heading">
                <div>
                  <span>BUSINESS PROFILE</span>
                  <h2>Company</h2>
                  <p className="fp-settings-copy">
                    Business and operating information used across MileVoxa.
                  </p>
                </div>
                <div className="fp-company-role-badge">{role}</div>
              </div>

              {!companyProfileReady && (
                <div className="fp-settings-warning">
                  Run <b>supabase_company_preferences_setup.sql</b> once to enable the expanded company profile.
                </div>
              )}

              <form onSubmit={saveCompany}>
                <div className="fp-company-form-section">
                  <div className="fp-company-section-title">
                    <strong>Business Identity</strong>
                    <span>Basic company and carrier identifiers.</span>
                  </div>

                  <div className="fp-company-form-grid">
                    <CompanyField
                      label="Display Name"
                      value={companyProfile.name}
                      onChange={(value) =>
                        setCompanyProfile((current) => ({ ...current, name: value }))
                      }
                      disabled={!owner}
                      required
                    />
                    <CompanyField
                      label="Legal Business Name"
                      value={companyProfile.legal_name}
                      onChange={(value) =>
                        setCompanyProfile((current) => ({ ...current, legal_name: value }))
                      }
                      disabled={!owner}
                      placeholder="Legal LLC / corporation name"
                    />
                    <CompanyField
                      label="USDOT Number"
                      value={companyProfile.dot_number}
                      onChange={(value) =>
                        setCompanyProfile((current) => ({ ...current, dot_number: value }))
                      }
                      disabled={!owner}
                      placeholder="e.g. 1234567"
                    />
                    <CompanyField
                      label="MC Number"
                      value={companyProfile.mc_number}
                      onChange={(value) =>
                        setCompanyProfile((current) => ({ ...current, mc_number: value }))
                      }
                      disabled={!owner}
                      placeholder="e.g. MC-123456"
                    />
                  </div>
                </div>

                <div className="fp-company-form-section">
                  <div className="fp-company-section-title">
                    <strong>Contact</strong>
                    <span>Primary business contact information.</span>
                  </div>

                  <div className="fp-company-form-grid">
                    <CompanyField
                      label="Business Email"
                      type="email"
                      value={companyProfile.email}
                      onChange={(value) =>
                        setCompanyProfile((current) => ({ ...current, email: value }))
                      }
                      disabled={!owner}
                      placeholder="dispatch@company.com"
                    />
                    <CompanyField
                      label="Business Phone"
                      type="tel"
                      value={companyProfile.phone}
                      onChange={(value) =>
                        setCompanyProfile((current) => ({ ...current, phone: value }))
                      }
                      disabled={!owner}
                      placeholder="+1 ..."
                    />
                  </div>
                </div>

                <div className="fp-company-form-section">
                  <div className="fp-company-section-title">
                    <strong>Business Address</strong>
                    <span>Used for company records and future documents/invoices.</span>
                  </div>

                  <div className="fp-company-form-grid">
                    <CompanyField
                      label="Address"
                      value={companyProfile.address_line1}
                      onChange={(value) =>
                        setCompanyProfile((current) => ({ ...current, address_line1: value }))
                      }
                      disabled={!owner}
                      placeholder="Street address"
                      wide
                    />
                    <CompanyField
                      label="Address Line 2"
                      value={companyProfile.address_line2}
                      onChange={(value) =>
                        setCompanyProfile((current) => ({ ...current, address_line2: value }))
                      }
                      disabled={!owner}
                      placeholder="Suite, unit, etc."
                      wide
                    />
                    <CompanyField
                      label="City"
                      value={companyProfile.city}
                      onChange={(value) =>
                        setCompanyProfile((current) => ({ ...current, city: value }))
                      }
                      disabled={!owner}
                    />
                    <CompanyField
                      label="State"
                      value={companyProfile.state}
                      onChange={(value) =>
                        setCompanyProfile((current) => ({ ...current, state: value }))
                      }
                      disabled={!owner}
                      placeholder="GA"
                    />
                    <CompanyField
                      label="ZIP Code"
                      value={companyProfile.postal_code}
                      onChange={(value) =>
                        setCompanyProfile((current) => ({ ...current, postal_code: value }))
                      }
                      disabled={!owner}
                    />
                    <CompanyField
                      label="Country"
                      value={companyProfile.country}
                      onChange={(value) =>
                        setCompanyProfile((current) => ({ ...current, country: value }))
                      }
                      disabled={!owner}
                    />
                  </div>
                </div>

                <div className="fp-company-form-section">
                  <div className="fp-company-section-title">
                    <strong>Operations</strong>
                    <span>Default company-level operating context.</span>
                  </div>

                  <div className="fp-company-form-grid">
                    <label className="fp-company-field">
                      <span>Company Time Zone</span>
                      <select
                        value={companyProfile.timezone}
                        disabled={!owner}
                        onChange={(event) =>
                          setCompanyProfile((current) => ({
                            ...current,
                            timezone: event.target.value,
                          }))
                        }
                      >
                        {US_TIMEZONES.map((zone) => (
                          <option key={zone.value} value={zone.value}>
                            {zone.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="fp-company-field">
                      <span>Your Role</span>
                      <input value={role} readOnly />
                    </label>
                  </div>
                </div>

                {!owner && (
                  <div className="fp-settings-info">
                    Only the company owner can change company-level settings.
                  </div>
                )}

                <div className="fp-company-save-row">
                  <span>Changes apply to this MileVoxa company account.</span>
                  <button
                    className="fp-primary-btn settings-save"
                    disabled={saving || !owner || !companyProfileReady}
                  >
                    {saving ? "Saving..." : "Save Company"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {tab === "business-costs" && (
            <section className="fp-panel fp-settings-main-card fp-business-costs-settings">
              <div className="fp-settings-section-heading">
                <div>
                  <span>SHARED COMPANY ACCOUNTING</span>
                  <h2>Business Costs & Fees</h2>
                  <p className="fp-settings-copy">
                    These settings are stored in the same Supabase company
                    records used by MileVoxa mobile. Changes made here are
                    available to both apps.
                  </p>
                </div>
                <div className="fp-company-role-badge">{role}</div>
              </div>

              {!businessCostsReady && (
                <div className="fp-settings-warning">
                  MileVoxa could not read the shared company fee/fixed-expense
                  tables. Verify <b>company_fee_settings</b> and{" "}
                  <b>weekly_fixed_expenses</b> in Supabase.
                </div>
              )}

              <div className="fp-business-cost-sync-note">
                <span className="fp-business-cost-sync-icon">↔</span>
                <div>
                  <strong>Mobile + Web synchronized through Supabase</strong>
                  <p>
                    This page does not keep a separate web copy. Weekly
                    Settlement, Dashboard and Load Profitability use these same
                    company records.
                  </p>
                </div>
              </div>

              <div className="fp-company-form-section">
                <div className="fp-company-section-title">
                  <strong>Company Fees</strong>
                  <span>
                    Percentage and mileage fees deducted when MileVoxa
                    calculates weekly operating profit.
                  </span>
                </div>

                <div className="fp-business-fee-grid">
                  <div className="fp-business-fee-card">
                    <div className="fp-business-fee-card-heading">
                      <div>
                        <span>REVENUE FEE</span>
                        <strong>Company Fee</strong>
                      </div>
                      <button
                        type="button"
                        className={`fp-business-cost-toggle ${
                          companyFees.is_revenue_fee_active ? "on" : ""
                        }`}
                        disabled={!owner}
                        onClick={() =>
                          setCompanyFees((current) => ({
                            ...current,
                            is_revenue_fee_active:
                              !current.is_revenue_fee_active,
                          }))
                        }
                        aria-pressed={companyFees.is_revenue_fee_active}
                      >
                        <i />
                      </button>
                    </div>

                    <label>
                      <span>Percent of Gross Revenue</span>
                      <div className="fp-business-money-input suffix">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          disabled={!owner}
                          value={companyFees.revenue_fee_percent}
                          onChange={(event) =>
                            setCompanyFees((current) => ({
                              ...current,
                              revenue_fee_percent:
                                Number(event.target.value) || 0,
                            }))
                          }
                        />
                        <b>%</b>
                      </div>
                    </label>

                    <p>
                      Example: 15% deducts $1,500 from $10,000 gross weekly
                      revenue.
                    </p>
                  </div>

                  <div className="fp-business-fee-card">
                    <div className="fp-business-fee-card-heading">
                      <div>
                        <span>MILEAGE FEE</span>
                        <strong>Company Mileage Fee</strong>
                      </div>
                      <button
                        type="button"
                        className={`fp-business-cost-toggle ${
                          companyFees.is_mileage_fee_active ? "on" : ""
                        }`}
                        disabled={!owner}
                        onClick={() =>
                          setCompanyFees((current) => ({
                            ...current,
                            is_mileage_fee_active:
                              !current.is_mileage_fee_active,
                          }))
                        }
                        aria-pressed={companyFees.is_mileage_fee_active}
                      >
                        <i />
                      </button>
                    </div>

                    <label>
                      <span>Rate Per Mile</span>
                      <div className="fp-business-money-input">
                        <b>$</b>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={!owner}
                          value={companyFees.mileage_fee_per_mile}
                          onChange={(event) =>
                            setCompanyFees((current) => ({
                              ...current,
                              mileage_fee_per_mile:
                                Number(event.target.value) || 0,
                            }))
                          }
                        />
                        <em>/ mi</em>
                      </div>
                    </label>

                    <p>
                      Applied to the weekly odometer miles used by MileVoxa
                      settlement calculations.
                    </p>
                  </div>
                </div>

                <div className="fp-business-fee-save">
                  <span>
                    Current:{" "}
                    {companyFees.is_revenue_fee_active
                      ? `${companyFees.revenue_fee_percent}% revenue fee`
                      : "Revenue fee disabled"}
                    {" · "}
                    {companyFees.is_mileage_fee_active
                      ? `$${companyFees.mileage_fee_per_mile.toFixed(2)}/mi`
                      : "Mileage fee disabled"}
                  </span>
                  <button
                    type="button"
                    className="fp-primary-btn"
                    disabled={
                      saving ||
                      !owner ||
                      !companyId ||
                      !businessCostsReady
                    }
                    onClick={() => void saveCompanyFees()}
                  >
                    {saving ? "Saving..." : "Save Company Fees"}
                  </button>
                </div>
              </div>

              <div className="fp-company-form-section">
                <div className="fp-company-section-title">
                  <strong>Weekly Fixed Expenses</strong>
                  <span>
                    Recurring weekly costs deducted from gross revenue:
                    insurance, truck rent, office expense and similar costs.
                  </span>
                </div>

                <div className="fp-fixed-expense-presets">
                  <span>Quick add:</span>
                  {[
                    "Insurance",
                    "Bobtail Insurance",
                    "IFTA",
                    "OAI",
                    "Office Expense",
                    "Truck Rent",
                  ].map((name) => (
                    <button
                      key={name}
                      type="button"
                      disabled={!owner}
                      onClick={() => addPresetFixedExpense(name)}
                    >
                      + {name}
                    </button>
                  ))}
                </div>

                <div className="fp-fixed-expense-list">
                  {fixedExpenses.map((row, index) => (
                    <div key={row.id || `new-${index}`} className="fp-fixed-expense-row">
                      <div className="fp-fixed-expense-main">
                        <input
                          aria-label="Fixed expense name"
                          value={row.name}
                          disabled={!owner}
                          onChange={(event) =>
                            setFixedExpenses((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, name: event.target.value }
                                  : item
                              )
                            )
                          }
                        />

                        <div className="fp-business-money-input">
                          <b>$</b>
                          <input
                            aria-label={`${row.name} weekly amount`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.amount}
                            disabled={!owner}
                            onChange={(event) =>
                              setFixedExpenses((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        amount:
                                          Number(event.target.value) || 0,
                                      }
                                    : item
                                )
                              )
                            }
                          />
                          <em>/ week</em>
                        </div>
                      </div>

                      <div className="fp-fixed-expense-actions">
                        <button
                          type="button"
                          className={`fp-business-cost-toggle ${
                            row.is_active ? "on" : ""
                          }`}
                          disabled={!owner}
                          aria-label={`${row.is_active ? "Disable" : "Enable"} ${row.name}`}
                          onClick={() =>
                            setFixedExpenses((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      is_active: !item.is_active,
                                    }
                                  : item
                              )
                            )
                          }
                        >
                          <i />
                        </button>

                        <button
                          type="button"
                          className="fp-fixed-save"
                          disabled={saving || !owner}
                          onClick={() => void saveFixedExpense(row)}
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          className="fp-fixed-delete"
                          disabled={saving || !owner || !row.id}
                          onClick={() => void deleteFixedExpense(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {fixedExpenses.length === 0 && (
                    <div className="fp-fixed-expense-empty">
                      No weekly fixed expenses are stored yet. Add the costs
                      your company pays every week.
                    </div>
                  )}
                </div>

                <div className="fp-fixed-expense-add">
                  <div>
                    <label>
                      <span>Expense Name</span>
                      <input
                        value={newFixedName}
                        disabled={!owner}
                        placeholder="e.g. Trailer Rent"
                        onChange={(event) =>
                          setNewFixedName(event.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span>Weekly Amount</span>
                      <div className="fp-business-money-input">
                        <b>$</b>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={!owner}
                          placeholder="0.00"
                          value={newFixedAmount}
                          onChange={(event) =>
                            setNewFixedAmount(event.target.value)
                          }
                        />
                        <em>/ week</em>
                      </div>
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={saving || !owner || !newFixedName.trim()}
                    onClick={() => void addFixedExpense()}
                  >
                    + Add Fixed Expense
                  </button>
                </div>
              </div>

              {!owner && (
                <div className="fp-settings-info">
                  Only the company owner can change company-level fees and
                  fixed expenses. Members still see the values used in company
                  calculations.
                </div>
              )}
            </section>
          )}

          {tab === "preferences" && (
            <section className="fp-panel fp-settings-main-card fp-preferences-settings">
              <div className="fp-settings-section-heading">
                <div>
                  <span>APP EXPERIENCE</span>
                  <h2>Preferences</h2>
                  <p className="fp-settings-copy">
                    Control how MileVoxa formats dates, weeks and common operating views.
                  </p>
                </div>
              </div>

              {!preferencesReady && (
                <div className="fp-settings-warning">
                  Run <b>supabase_company_preferences_setup.sql</b> once to enable all preference options.
                </div>
              )}

              <div className="fp-preference-section">
                <div className="fp-company-section-title">
                  <strong>Regional & Formatting</strong>
                  <span>How MileVoxa displays business information.</span>
                </div>

                <div className="fp-settings-select-grid">
                  <SelectSetting
                    label="Language"
                    value={preferences.language}
                    options={["English"]}
                    onChange={(value) =>
                      setPreferences((current) => ({ ...current, language: value }))
                    }
                  />
                  <SelectSetting
                    label="Date Format"
                    value={preferences.date_format}
                    options={["MMM d, yyyy", "MM/dd/yyyy", "dd/MM/yyyy"]}
                    onChange={(value) =>
                      setPreferences((current) => ({ ...current, date_format: value }))
                    }
                  />
                  <SelectSetting
                    label="Time Format"
                    value={preferences.time_format}
                    options={["12-hour", "24-hour"]}
                    onChange={(value) =>
                      setPreferences((current) => ({ ...current, time_format: value }))
                    }
                  />
                  <label>
                    Time Zone
                    <select
                      value={preferences.timezone}
                      onChange={(event) =>
                        setPreferences((current) => ({
                          ...current,
                          timezone: event.target.value,
                        }))
                      }
                    >
                      {US_TIMEZONES.map((zone) => (
                        <option key={zone.value} value={zone.value}>
                          {zone.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="fp-preference-section">
                <div className="fp-company-section-title">
                  <strong>Operating Defaults</strong>
                  <span>Default behavior for weekly trucking workflows.</span>
                </div>

                <div className="fp-settings-select-grid">
                  <SelectSetting
                    label="Week Starts On"
                    value={preferences.week_start}
                    options={["Monday", "Sunday"]}
                    onChange={(value) =>
                      setPreferences((current) => ({ ...current, week_start: value }))
                    }
                  />
                  <SelectSetting
                    label="Default Performance Period"
                    value={preferences.default_period}
                    options={["Week", "Month", "All Time"]}
                    onChange={(value) =>
                      setPreferences((current) => ({ ...current, default_period: value }))
                    }
                  />

                  <LockedPreference
                    label="Currency"
                    value="USD ($)"
                    note="MileVoxa accounting currently runs in USD."
                  />
                  <LockedPreference
                    label="Distance Unit"
                    value="Miles"
                    note="MileVoxa mileage/IFTA workflows currently use miles."
                  />
                </div>
              </div>

              <div className="fp-preference-section">
                <div className="fp-company-section-title">
                  <strong>Display</strong>
                  <span>Control data density in large tables.</span>
                </div>

                <ToggleSetting
                  label="Compact tables"
                  description="Show more rows at once on Loads, Expenses and other data-heavy pages."
                  checked={preferences.compact_tables}
                  onChange={(value) =>
                    setPreferences((current) => ({
                      ...current,
                      compact_tables: value,
                    }))
                  }
                />
              </div>

              <div className="fp-company-save-row">
                <span>Preferences are saved to your MileVoxa user account.</span>
                <button
                  className="fp-primary-btn settings-save"
                  type="button"
                  disabled={saving || !preferencesReady}
                  onClick={savePreferences}
                >
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </section>
          )}

          {tab === "notifications" && (
            <section className="fp-panel fp-settings-main-card">
              <h2>Notifications</h2>
              <p className="fp-settings-copy">
                Choose which MileVoxa events should be eligible for notifications.
              </p>

              {!preferencesReady && (
                <div className="fp-settings-warning">
                  Run <b>supabase_settings_setup.sql</b> once to save notification choices.
                </div>
              )}

              <ToggleSetting
                label="Load updates"
                description="Status and operational updates related to loads."
                checked={preferences.notify_load_updates}
                onChange={(value) =>
                  setPreferences((current) => ({
                    ...current,
                    notify_load_updates: value,
                  }))
                }
              />

              <ToggleSetting
                label="Maintenance reminders"
                description="Upcoming service dates and mileage thresholds."
                checked={preferences.notify_maintenance}
                onChange={(value) =>
                  setPreferences((current) => ({
                    ...current,
                    notify_maintenance: value,
                  }))
                }
              />

              <ToggleSetting
                label="Weekly business summary"
                description="A recurring summary of fleet performance and costs."
                checked={preferences.notify_weekly_summary}
                onChange={(value) =>
                  setPreferences((current) => ({
                    ...current,
                    notify_weekly_summary: value,
                  }))
                }
              />

              <ToggleSetting
                label="Product updates"
                description="Important MileVoxa product and feature announcements."
                checked={preferences.notify_product_updates}
                onChange={(value) =>
                  setPreferences((current) => ({
                    ...current,
                    notify_product_updates: value,
                  }))
                }
              />

              <button
                className="fp-primary-btn settings-save"
                type="button"
                disabled={saving}
                onClick={savePreferences}
              >
                {saving ? "Saving..." : "Save Notifications"}
              </button>
            </section>
          )}

          {tab === "subscription" && (
            <section className="fp-panel fp-settings-main-card fp-subscription-center">
              <div className="fp-subscription-heading">
                <div>
                  <span>PLAN & BILLING</span>
                  <h2>Subscription</h2>
                  <p className="fp-settings-copy">
                    See your MileVoxa plan, trial status and what happens next.
                  </p>
                </div>
                <div className={`fp-subscription-status ${trialActive ? "trial" : paidActive ? "active" : "ended"}`}>
                  {subscriptionLabel}
                </div>
              </div>

              <div className="fp-trial-hero">
                <div className="fp-trial-hero-copy">
                  <span>{subscriptionInfo.planName}</span>
                  {paidActive ? (
                    <>
                      <h3>Your MileVoxa Pro subscription is active.</h3>
                      <p>
                        You have access to the complete MileVoxa operating system.
                      </p>
                    </>
                  ) : trialActive ? (
                    <>
                      <h3>
                        {trialDaysRemaining} day{trialDaysRemaining === 1 ? "" : "s"} remaining
                      </h3>
                      <p>
                        Your 14-day MileVoxa Pro trial ends on{" "}
                        <strong>{formatSubscriptionDate(trialEnd)}</strong>.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3>Your free trial has ended.</h3>
                      <p>
                        Choose a MileVoxa Pro plan when you are ready to continue with Pro access.
                      </p>
                    </>
                  )}
                </div>

                {!paidActive && (
                  <div className="fp-trial-progress-block">
                    <div className="fp-trial-progress-top">
                      <span>Trial progress</span>
                      <strong>
                        {trialActive
                          ? `${trialDaysUsed} of 14 days used`
                          : "14 of 14 days used"}
                      </strong>
                    </div>
                    <div className="fp-trial-progress-track">
                      <i
                        style={{
                          width: `${trialActive ? Math.max(4, trialProgress) : 100}%`,
                        }}
                      />
                    </div>
                    <div className="fp-trial-progress-dates">
                      <span>{formatSubscriptionDate(trialStart)}</span>
                      <span>{formatSubscriptionDate(trialEnd)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="fp-subscription-facts">
                <SubscriptionFact
                  label="Current plan"
                  value={subscriptionInfo.planName}
                />
                <SubscriptionFact
                  label="Status"
                  value={subscriptionLabel}
                />
                <SubscriptionFact
                  label={paidActive ? "Billing period ends" : "Trial ends"}
                  value={formatSubscriptionDate(
                    paidActive && subscriptionInfo.currentPeriodEnd
                      ? new Date(subscriptionInfo.currentPeriodEnd)
                      : trialEnd
                  )}
                />
                <SubscriptionFact
                  label="Trial payment"
                  value="No card required"
                />
              </div>

              <div className="fp-subscription-included">
                <div>
                  <span>WHAT YOU HAVE ACCESS TO</span>
                  <h3>Full MileVoxa Pro during your trial</h3>
                </div>
                <div className="fp-subscription-feature-grid">
                  {[
                    "Loads & truck management",
                    "Expenses & reimbursements",
                    "Fuel analytics",
                    "Maintenance tracking",
                    "Weekly settlement",
                    "Reports & exports",
                    "Documents & alerts",
                    "Pilot AI",
                  ].map((item) => (
                    <div key={item}>
                      <i>✓</i>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!subscriptionInfo.storageReady && (
                <div className="fp-subscription-storage-note">
                  <strong>Trial storage setup recommended</strong>
                  <span>
                    MileVoxa is currently calculating this trial from the account creation date. Run <b>supabase_trial_subscription_setup.sql</b> once so trial dates are stored permanently at company level.
                  </span>
                </div>
              )}

              <div className="fp-subscription-actions">
                <div>
                  <strong>
                    {trialActive
                      ? "Enjoy the full product during your trial."
                      : paidActive
                        ? "Your subscription is active."
                        : "Ready to continue with MileVoxa Pro?"}
                  </strong>
                  <span>
                    Stripe checkout remains disabled until billing/legal setup is completed.
                  </span>
                </div>

                <div>
                  <Link href="/pricing" className="fp-subscription-secondary">
                    View Plan Details
                  </Link>
                  <button
                    type="button"
                    className="fp-subscription-primary"
                    disabled
                    title="Billing will be enabled after Stripe setup is complete."
                  >
                    {paidActive ? "Manage Subscription" : "Choose Plan"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {tab === "data" && (
            <section className="fp-panel fp-settings-main-card">
              <h2>Data & Export</h2>
              <p className="fp-settings-copy">
                Download a structured JSON export of the MileVoxa business data accessible to your account.
              </p>

              <div className="fp-data-export-card">
                <div>
                  <strong>MileVoxa Account Export</strong>
                  <span>
                    Includes trucks, loads, expenses, reimbursements, maintenance, settlements-related data, document metadata and account settings.
                  </span>
                </div>
                <button onClick={exportAccount} disabled={saving}>
                  {saving ? "Preparing..." : "Export JSON"}
                </button>
              </div>

              <div className="fp-settings-info">
                Private document file contents are not bundled into this export. Only document metadata is included.
              </div>
            </section>
          )}

          {tab === "legal" && (
            <section className="fp-panel fp-settings-main-card fp-legal-settings">
              <div className="fp-settings-section-heading">
                <div>
                  <span>LEGAL & PRIVACY</span>
                  <h2>Legal & Privacy</h2>
                  <p className="fp-settings-copy">
                    Review MileVoxa&apos;s legal policies and manage your personal account data from one place.
                  </p>
                </div>
              </div>

              <div className="fp-legal-settings-grid">
                <Link href="/privacy" className="fp-legal-settings-card">
                  <div className="fp-legal-settings-icon">P</div>
                  <div>
                    <span>PRIVACY</span>
                    <strong>Privacy Policy</strong>
                    <p>
                      See what MileVoxa processes, how Google sign-in works,
                      and how account data is handled.
                    </p>
                  </div>
                  <b>→</b>
                </Link>

                <Link href="/terms" className="fp-legal-settings-card">
                  <div className="fp-legal-settings-icon">T</div>
                  <div>
                    <span>TERMS</span>
                    <strong>Terms of Service</strong>
                    <p>
                      Review MileVoxa account, service, trial, and operational
                      calculation terms.
                    </p>
                  </div>
                  <b>→</b>
                </Link>

                <Link href="/data-deletion" className="fp-legal-settings-card">
                  <div className="fp-legal-settings-icon">D</div>
                  <div>
                    <span>ACCOUNT DATA</span>
                    <strong>Data Deletion</strong>
                    <p>
                      Understand what is deleted, what minimal information is
                      retained, and what happens if you sign in again with Google.
                    </p>
                  </div>
                  <b>→</b>
                </Link>
              </div>

              <div className="fp-legal-settings-section">
                <div className="fp-company-section-title">
                  <strong>Your Data</strong>
                  <span>
                    Download supported MileVoxa account and business information before making account changes.
                  </span>
                </div>

                <div className="fp-legal-data-action">
                  <div>
                    <strong>Export My MileVoxa Data</strong>
                    <span>
                      Creates a structured JSON export of the account and business
                      data currently available through MileVoxa.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void exportAccount()}
                    disabled={saving}
                  >
                    {saving ? "Preparing..." : "Export My Data"}
                  </button>
                </div>
              </div>

              <div className="fp-legal-settings-section">
                <div className="fp-company-section-title">
                  <strong>Google Sign-In</strong>
                  <span>
                    MileVoxa uses Google only for authentication when you choose
                    Continue with Google.
                  </span>
                </div>

                <div className="fp-google-account-note">
                  <div className="fp-google-account-mark">G</div>
                  <div>
                    <strong>{email}</strong>
                    <span>
                      Google sign-in does not give MileVoxa access to your Gmail
                      inbox, Google Drive, or your Google password.
                    </span>
                  </div>
                </div>
              </div>

              <div className="fp-legal-settings-section fp-legal-danger-section">
                <div className="fp-company-section-title">
                  <strong>Delete Account</strong>
                  <span>
                    Permanently remove your MileVoxa account. If you are the sole
                    owner/member, eligible company-scoped data is removed too.
                  </span>
                </div>

                <div className="fp-legal-delete-action">
                  <div>
                    <strong>Delete MileVoxa Account</strong>
                    <span>
                      This action is permanent. Export anything you want to keep
                      before continuing.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </section>
          )}

          {tab === "security" && (
            <section className="fp-panel fp-settings-main-card">
              <h2>Security</h2>
              <p className="fp-settings-copy">
                Manage access to your MileVoxa account.
              </p>

              <SecurityAction
                title="Change password"
                description="Send a secure Supabase password-reset link to your email."
                action="Send Reset Email"
                onClick={resetPassword}
              />

              <SecurityAction
                title="Sign out everywhere"
                description="End MileVoxa sessions across devices for this account."
                action="Sign Out Everywhere"
                onClick={signOutEverywhere}
                danger
              />

              <SecurityAction
                title="Delete MileVoxa account"
                description="Permanently delete this user account. If you are the sole company owner, company-scoped MileVoxa data is deleted with it."
                action="Delete Account"
                onClick={() => setDeleteOpen(true)}
                danger
              />

              <div className="fp-settings-info">
                Before deleting, you can download your account data from the
                Data &amp; Export tab. See the{" "}
                <Link href="/data-deletion">Data Deletion page</Link> for the
                deletion and deleted-Google-account behavior.
              </div>
            </section>
          )}
        </main>

        <aside className="fp-right-stack">
          <section className="fp-panel side fp-settings-summary">
            <h2>Account</h2>
            <div className="fp-settings-summary-avatar">
              {avatar ? (
                <img src={avatar} alt="" />
              ) : (
                name?.[0]?.toUpperCase() || "F"
              )}
            </div>
            <strong>{name}</strong>
            <span>{companyProfile.name}</span>
            <em>{role}</em>
          </section>

          <section className="fp-panel side">
            <h2>Security Status</h2>
            <StatusRow label="Authenticated" good />
            <StatusRow label="Company linked" good={Boolean(companyId)} />
            <StatusRow label="Preferences storage" good={preferencesReady} />
            <StatusRow label="Business cost sync" good={businessCostsReady} />
            <StatusRow label="Account access" good />
          </section>
        </aside>
      </div>

      {deleteOpen && (
        <div className="fp-delete-overlay" role="dialog" aria-modal="true">
          <div className="fp-delete-modal fp-delete-modal-permanent">
            <span className="fp-delete-kicker">PERMANENT ACTION</span>
            <h2>Delete MileVoxa Account</h2>
            <p>
              This deletes your MileVoxa login. If you are the only member
              and owner of the company, the company workspace and eligible
              company-scoped records are deleted too. This cannot restore your
              old MileVoxa business data later.
            </p>

            <div className="fp-delete-impact">
              <strong>Before you continue</strong>
              <span>Export anything you want to keep from Data &amp; Export.</span>
              <span>
                If your company has other members, MileVoxa will block owner
                deletion until ownership/member access is resolved.
              </span>
              <span>
                A minimal deletion marker is retained so Google sign-in does
                not silently recreate the deleted account.
              </span>
            </div>

            <label>
              Optional reason
              <textarea
                rows={3}
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="Optional feedback"
              />
            </label>

            <label>
              Type DELETE to confirm
              <input
                autoComplete="off"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder="DELETE"
              />
            </label>

            <div className="fp-delete-legal-links">
              <Link href="/privacy" target="_blank">Privacy Policy</Link>
              <Link href="/data-deletion" target="_blank">Data Deletion</Link>
            </div>

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
                onClick={() => void deleteAccount()}
              >
                {deleteBusy ? "Deleting..." : "Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Phoenix", label: "Arizona Time" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
];

function CompanyField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  disabled = false,
  required = false,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={`fp-company-field ${wide ? "wide" : ""}`}>
      <span>{label}{required ? " *" : ""}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function LockedPreference({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="fp-locked-preference">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function SubscriptionFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="fp-subscription-fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatSubscriptionDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}


async function avatarToJpeg(file: File) {
  const image = await loadImage(file);
  const maxSize = 512;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare profile photo.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.88)
  );

  if (!blob) {
    throw new Error("Could not convert profile photo.");
  }

  return blob;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the selected image."));
    };

    image.src = url;
  });
}


function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? "active" : ""} onClick={onClick}>
      {label}
    </button>
  );
}

function SelectSetting({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="fp-toggle-setting">
      <div>
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <button
        className={checked ? "on" : ""}
        onClick={() => onChange(!checked)}
        type="button"
        aria-pressed={checked}
      >
        <i />
      </button>
    </div>
  );
}

function SecurityAction({
  title,
  description,
  action,
  onClick,
  danger = false,
  disabled = false,
}: {
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="fp-security-action">
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <button
        className={danger ? "danger" : ""}
        onClick={onClick}
        disabled={disabled}
      >
        {action}
      </button>
    </div>
  );
}

function StatusRow({
  label,
  good,
}: {
  label: string;
  good: boolean;
}) {
  return (
    <div className="fp-settings-status-row">
      <span>{label}</span>
      <b className={good ? "good" : "warn"}>
        {good ? "Ready" : "Setup"}
      </b>
    </div>
  );
}
