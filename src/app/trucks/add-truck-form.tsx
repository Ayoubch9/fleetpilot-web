"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AddTruckForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const form = new FormData(event.currentTarget);
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

    event.currentTarget.reset();
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        className="rounded-[6px] bg-[#1188ff] px-4 py-2.5 text-[10px] font-black text-white shadow-[0_7px_18px_rgba(17,136,255,.15)] hover:bg-[#0879ee]"
      >
        {open ? "Close" : "+ Add Truck"}
      </button>

      {open && (
        <form
          onSubmit={submit}
          className="mt-5 grid gap-4 rounded-[10px] border border-[#dce5ef] bg-white p-5 md:grid-cols-2"
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
            <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="md:col-span-2 flex justify-end">
            <button
              disabled={saving}
              className="rounded-[6px] bg-[#17c978] px-4 py-2.5 text-[10px] font-black text-white disabled:opacity-50"
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
    <label className="block">
      <span className="mb-2 block text-[8px] font-black uppercase tracking-[.12em] text-[#71859a]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        step={step}
        className="w-full fp-field text-[11px]"
      />
    </label>
  );
}
