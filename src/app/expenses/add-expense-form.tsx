"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ReceiptUpload from "./receipt-upload";

type Truck = { id: string; unit_number: string };
type Load = { id: string; load_number: string | null; pickup: string | null; delivery: string | null };

const categories = [
  "Fuel",
  "Maintenance",
  "Tolls",
  "Parking",
  "Scale",
  "Insurance",
  "Permits",
  "Driver Pay",
  "Truck Payment",
  "Trailer",
  "Food / Travel",
  "Other",
];

export default function AddExpenseForm({
  trucks,
  loads,
}: {
  trucks: Truck[];
  loads: Load[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("Fuel");
  const [receiptPath, setReceiptPath] = useState<string | null>(null);

  useEffect(() => {
    function openAddExpense() {
      setError("");
      setOpen(true);
      window.setTimeout(() => {
        document.getElementById("add-expense")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 40);
    }

    window.addEventListener("fleetpilot:open-add-expense", openAddExpense);
    return () =>
      window.removeEventListener("fleetpilot:open-add-expense", openAddExpense);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const amount = Number(form.get("amount")) || 0;

    if (amount <= 0) {
      setError("Expense amount must be greater than zero.");
      setSaving(false);
      return;
    }

    const supabase = createClient();

    const { error: insertError } = await supabase.from("expenses").insert({
      truck_id: String(form.get("truck_id") || "") || null,
      load_id: String(form.get("load_id") || "") || null,
      category,
      expense_date: String(form.get("expense_date")),
      amount,
      vendor: String(form.get("vendor") || "").trim(),
      description: String(form.get("description") || "").trim(),
      gallons: category === "Fuel" ? Number(form.get("gallons")) || null : null,
      fuel_price_per_gallon:
        category === "Fuel" ? Number(form.get("fuel_price_per_gallon")) || null : null,
      receipt_path: receiptPath,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    formElement.reset();
    setCategory("Fuel");
    setReceiptPath(null);
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {open && (
        <form
          onSubmit={submit}
          className="fp-add-expense-form"
        >
          <label className="fp-add-expense-field">
            <span>Category *</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="fp-add-expense-control"
            >
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          <Field name="expense_date" label="Expense Date *" type="date" required />
          <Field name="amount" label="Amount *" type="number" step="0.01" />
          <Field name="vendor" label="Vendor" />

          <Select
            name="truck_id"
            label="Assign to Truck"
            items={[{ value: "", label: "No truck" }, ...trucks.map((t) => ({ value: t.id, label: `Truck #${t.unit_number}` }))]}
          />

          <Select
            name="load_id"
            label="Assign to Load"
            items={[
              { value: "", label: "No load" },
              ...loads.map((l) => ({
                value: l.id,
                label: `${l.load_number || "Load"} — ${l.pickup || ""} → ${l.delivery || ""}`,
              })),
            ]}
          />

          {category === "Fuel" && (
            <>
              <Field name="gallons" label="Gallons" type="number" step="0.001" />
              <Field name="fuel_price_per_gallon" label="Price / Gallon" type="number" step="0.001" />
            </>
          )}

          <ReceiptUpload onUploaded={setReceiptPath} />

          <label className="fp-add-expense-field md:col-span-2">
            <span>Description / Notes</span>
            <textarea
              name="description"
              rows={3}
              className="fp-add-expense-textarea"
            />
          </label>

          {error && (
            <div className="fp-add-expense-error md:col-span-2">
              {error}
            </div>
          )}

          <div className="fp-add-expense-footer md:col-span-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setOpen(false)}
              className="fp-add-expense-close"
            >
              Close
            </button>
            <button disabled={saving} className="fp-add-expense-save">
              {saving ? "Saving..." : "Save Expense"}
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
  required,
}: {
  name: string;
  label: string;
  type?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <label className="fp-add-expense-field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={type === "date" ? new Date().toISOString().slice(0, 10) : undefined}
        className="fp-add-expense-control"
      />
    </label>
  );
}

function Select({
  name,
  label,
  items,
}: {
  name: string;
  label: string;
  items: { value: string; label: string }[];
}) {
  return (
    <label className="fp-add-expense-field">
      <span>{label}</span>
      <select
        name={name}
        className="fp-add-expense-control"
      >
        {items.map((item) => (
          <option key={`${name}-${item.value}`} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
