"use client";

import { FormEvent, useState } from "react";
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const form = new FormData(event.currentTarget);
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

    event.currentTarget.reset();
    setCategory("Fuel");
    setReceiptPath(null);
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
        {open ? "Close" : "+ Add Expense"}
      </button>

      {open && (
        <form
          onSubmit={submit}
          className="mt-5 grid gap-4 rounded-[10px] border border-[#dce5ef] bg-white p-5 md:grid-cols-2"
        >
          <label>
            <span className="mb-2 block text-[8px] font-black uppercase tracking-[.12em] text-[#71859a]">Category *</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full fp-field text-[11px]"
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

          <label className="md:col-span-2">
            <span className="mb-2 block text-[8px] font-black uppercase tracking-[.12em] text-[#71859a]">Description / Notes</span>
            <textarea
              name="description"
              rows={3}
              className="w-full resize-none fp-field text-[11px]"
            />
          </label>

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
    <label>
      <span className="mb-2 block text-[8px] font-black uppercase tracking-[.12em] text-[#71859a]">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={type === "date" ? new Date().toISOString().slice(0, 10) : undefined}
        className="w-full fp-field text-[11px]"
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
    <label>
      <span className="mb-2 block text-[8px] font-black uppercase tracking-[.12em] text-[#71859a]">{label}</span>
      <select
        name={name}
        className="w-full fp-field text-[11px]"
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
