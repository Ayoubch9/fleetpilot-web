"use client";

import { FormEvent, useEffect, useState } from "react";
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

  useEffect(() => {
    function openAddMaintenance() {
      setError("");
      setOpen(true);
      window.setTimeout(() => {
        document.getElementById("add-maintenance")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 40);
    }

    window.addEventListener(
      "fleetpilot:open-add-maintenance",
      openAddMaintenance
    );

    return () =>
      window.removeEventListener(
        "fleetpilot:open-add-maintenance",
        openAddMaintenance
      );
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
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

      formElement.reset();
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
      {open && (
        <form
          onSubmit={submit}
          className="fp-add-maint-form"
        >
          <label className="fp-add-maint-field">
            <Label>Truck *</Label>
            <select
              name="truck_id"
              required
              className="fp-add-maint-control"
            >
              <option value="">Select truck</option>
              {trucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  Truck #{truck.unit_number} — {Number(truck.current_mileage || 0).toFixed(0)} mi
                </option>
              ))}
            </select>
          </label>

          <label className="fp-add-maint-field">
            <Label>Service Type *</Label>
            <select name="service_type" required className="fp-add-maint-control">
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
            <div className="fp-add-maint-error md:col-span-2">
              {error}
            </div>
          )}

          <div className="fp-add-maint-footer md:col-span-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setOpen(false)}
              className="fp-add-maint-close"
            >
              Close
            </button>
            <button disabled={saving} className="fp-add-maint-save">
              {saving ? "Saving..." : "Save Service"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span>
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
    <label className="fp-add-maint-field">
      <Label>{label}</Label>
      <input
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={type === "date" && required ? new Date().toISOString().slice(0, 10) : undefined}
        className="fp-add-maint-control"
      />
    </label>
  );
}
