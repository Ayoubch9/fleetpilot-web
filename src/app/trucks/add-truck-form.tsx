"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AddTruckForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function openAddTruck() {
      setError("");
      setOpen(true);
      window.setTimeout(() => {
        document
          .getElementById("add-truck")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 40);
    }

    window.addEventListener("fleetpilot:open-add-truck", openAddTruck);
    return () =>
      window.removeEventListener("fleetpilot:open-add-truck", openAddTruck);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const unitNumber = String(form.get("unit_number") || "").trim();

    if (!unitNumber) {
      setError("Unit number is required.");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { error: insertError } = await supabase.from("trucks").insert({
      unit_number: unitNumber,
      year: Number(form.get("year")) || null,
      make: String(form.get("make") || "").trim(),
      model: String(form.get("model") || "").trim(),
      vin: String(form.get("vin") || "").trim(),
      license_plate: String(form.get("license_plate") || "").trim(),
      current_mileage: Number(form.get("current_mileage")) || 0,
      registration_expiry: String(form.get("registration_expiry") || "") || null,
      insurance_expiry: String(form.get("insurance_expiry") || "") || null,
      status: "ACTIVE",
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    formElement.reset();
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {open && (
        <form
          onSubmit={submit}
          className="fp-add-truck-form"
        >
          <Field name="unit_number" label="Unit Number *" />
          <Field name="year" label="Year" type="number" />
          <Field name="make" label="Make" />
          <Field name="model" label="Model" />
          <Field name="vin" label="VIN" />
          <Field name="license_plate" label="License Plate" />
          <Field name="current_mileage" label="Current Mileage" type="number" step="0.1" />
          <div />
          <Field name="registration_expiry" label="Registration Expiry" type="date" />
          <Field name="insurance_expiry" label="Insurance Expiry" type="date" />

          {error && (
            <div className="fp-add-truck-error md:col-span-2">
              {error}
            </div>
          )}

          <div className="fp-add-truck-footer md:col-span-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setOpen(false)}
              className="fp-add-truck-close"
            >
              Close
            </button>
            <button
              disabled={saving}
              className="fp-add-truck-save"
            >
              {saving ? "Saving..." : "Save Truck"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

function Field({
  name,
  label,
  type = "text",
  step,
}: {
  name: string;
  label: string;
  type?: string;
  step?: string;
}) {
  return (
    <label className="fp-add-truck-field">
      <span>
        {label}
      </span>
      <input
        name={name}
        type={type}
        step={step}
        className="fp-add-truck-control"
      />
    </label>
  );
}
