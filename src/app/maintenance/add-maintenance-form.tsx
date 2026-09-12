"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Truck = {
  id: string;
  unit_number: string;
  current_mileage: number | string | null;
};

const serviceTypes = [
  "Oil Change",
  "PM Service",
  "Tires",
  "Brakes",
  "DOT Inspection",
  "Engine Repair",
  "Transmission",
  "DEF/Emissions",
  "Electrical",
  "Other",
];

export default function AddMaintenanceForm({ trucks }: { trucks: Truck[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const form = new FormData(event.currentTarget);
    const truckId = String(form.get("truck_id") || "");
    const serviceDate = String(form.get("service_date") || "");
    const serviceType = String(form.get("service_type") || "");
    const mileage = Number(form.get("mileage")) || 0;
    const cost = Number(form.get("cost")) || 0;
    const vendor = String(form.get("vendor") || "").trim();

    if (!truckId || !serviceDate || !serviceType) {
      setError("Truck, service type and service date are required.");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    let expenseId: string | null = null;

    try {
      if (cost > 0) {
        const { data: expense, error: expenseError } = await supabase
          .from("expenses")
          .insert({
            truck_id: truckId,
            load_id: null,
            category: "Maintenance",
            expense_date: serviceDate,
            amount: cost,
            vendor,
            description: `${serviceType} maintenance service`,
            gallons: null,
            fuel_price_per_gallon: null,
          })
          .select("id")
          .single();

        if (expenseError) throw expenseError;
        expenseId = expense?.id ?? null;
      }

      const { error: maintenanceError } = await supabase
        .from("maintenance_records")
        .insert({
          truck_id: truckId,
          service_type: serviceType,
          service_date: serviceDate,
          mileage,
          vendor,
          cost,
          next_service_mileage:
            Number(form.get("next_service_mileage")) || null,
          next_service_date:
            String(form.get("next_service_date") || "") || null,
          expense_id: expenseId,
        });

      if (maintenanceError) throw maintenanceError;

      event.currentTarget.reset();
      setSaving(false);
      setOpen(false);
      router.refresh();
    } catch (e) {
      if (expenseId) {
        await supabase.from("expenses").delete().eq("id", expenseId);
      }

      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={trucks.length === 0}
        className="rounded-[6px] bg-[#1188ff] px-4 py-2.5 text-[10px] font-black text-white shadow-[0_7px_18px_rgba(17,136,255,.15)] disabled:opacity-40"
      >
        {open ? "Close" : "+ Add Service"}
      </button>

      {open && (
        <form
          onSubmit={submit}
          className="mt-5 grid gap-4 rounded-[10px] border border-[#dce5ef] bg-white p-5 md:grid-cols-2"
        >
          <label>
            <Label>Truck *</Label>
            <select
              name="truck_id"
              required
              className={inputClass}
            >
              <option value="">Select truck</option>
              {trucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  Truck #{truck.unit_number} — {Number(truck.current_mileage || 0).toFixed(0)} mi
                </option>
              ))}
            </select>
          </label>

          <label>
            <Label>Service Type *</Label>
            <select name="service_type" required className={inputClass}>
              {serviceTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <Field name="service_date" label="Service Date *" type="date" required />
          <Field name="mileage" label="Service Mileage" type="number" step="0.1" />
          <Field name="vendor" label="Vendor" />
          <Field name="cost" label="Cost" type="number" step="0.01" />
          <Field
            name="next_service_mileage"
            label="Next Service Mileage"
            type="number"
            step="0.1"
          />
          <Field name="next_service_date" label="Next Service Date" type="date" />

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
              {saving ? "Saving..." : "Save Service"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

const inputClass =
  "w-full fp-field text-[11px]";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-[8px] font-black uppercase tracking-[.12em] text-[#71859a]">
      {children}
    </span>
  );
}

function Field({
  name,
  label,
  type = "text",
  step,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <label>
      <Label>{label}</Label>
      <input
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={type === "date" && required ? new Date().toISOString().slice(0, 10) : undefined}
        className={inputClass}
      />
    </label>
  );
}
