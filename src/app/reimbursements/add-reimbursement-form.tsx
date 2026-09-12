"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Expense = {
  id: string;
  category: string | null;
  vendor: string | null;
  amount: number | string | null;
  expense_date: string | null;
};

export default function AddReimbursementForm({ expenses }: { expenses: Expense[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount")) || 0;

    if (!form.get("expense_id") || amount <= 0) {
      setError("Select an expense and enter the reimbursement amount.");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { error: insertError } = await supabase.from("reimbursements").insert({
      expense_id: String(form.get("expense_id")),
      reimbursement_date: String(form.get("reimbursement_date")),
      amount,
      notes: String(form.get("notes") || "").trim(),
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
        onClick={() => setOpen((v) => !v)}
        className="rounded-[6px] bg-[#1188ff] px-4 py-2.5 text-[10px] font-black text-white shadow-[0_7px_18px_rgba(17,136,255,.15)]"
      >
        {open ? "Close" : "+ Add Reimbursement"}
      </button>

      {open && (
        <form
          onSubmit={submit}
          className="mt-5 grid gap-4 rounded-[10px] border border-[#dce5ef] bg-white p-5 md:grid-cols-2"
        >
          <label className="md:col-span-2">
            <span className="mb-2 block text-[8px] font-black uppercase tracking-[.12em] text-[#71859a]">
              Expense *
            </span>
            <select
              name="expense_id"
              required
              className="w-full fp-field text-[11px]"
            >
              <option value="">Select expense</option>
              {expenses.map((expense) => (
                <option key={expense.id} value={expense.id}>
                  {expense.expense_date} · {expense.category || "Expense"} · {expense.vendor || "No vendor"} · ${Number(expense.amount || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-[8px] font-black uppercase tracking-[.12em] text-[#71859a]">Date *</span>
            <input
              name="reimbursement_date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full fp-field text-[11px]"
            />
          </label>

          <label>
            <span className="mb-2 block text-[8px] font-black uppercase tracking-[.12em] text-[#71859a]">Amount *</span>
            <input
              name="amount"
              type="number"
              step="0.01"
              required
              className="w-full fp-field text-[11px]"
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-[8px] font-black uppercase tracking-[.12em] text-[#71859a]">Notes</span>
            <textarea
              name="notes"
              rows={3}
              className="w-full fp-field text-[11px]"
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
              className="rounded-[6px] bg-[#17c978] px-4 py-2.5 text-[10px] font-black text-white"
            >
              {saving ? "Saving..." : "Save Reimbursement"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
