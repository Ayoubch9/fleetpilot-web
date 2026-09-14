"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Expense = {
  id: string;
  category: string | null;
  vendor: string | null;
  amount: number | string | null;
  expense_date: string | null;
  truck_id: string | null;
};

type Truck = {
  id: string;
  unit_number: string;
};

const CATEGORIES = [
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

export default function AddReimbursementForm({
  expenses,
  trucks,
}: {
  expenses: Expense[];
  trucks: Truck[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expenseId, setExpenseId] = useState("");
  const [category, setCategory] = useState("Other");
  const [truckId, setTruckId] = useState("");

  const selectedExpense = useMemo(
    () => expenses.find((expense) => expense.id === expenseId) || null,
    [expenseId, expenses]
  );

  useEffect(() => {
    function openAddReimbursement() {
      setError("");
      setOpen(true);
      window.setTimeout(() => {
        document.getElementById("add-reimbursement")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 40);
    }

    window.addEventListener(
      "fleetpilot:open-add-reimbursement",
      openAddReimbursement
    );

    return () =>
      window.removeEventListener(
        "fleetpilot:open-add-reimbursement",
        openAddReimbursement
      );
  }, []);

  function selectExpense(value: string) {
    setExpenseId(value);
    const expense = expenses.find((item) => item.id === value);

    if (expense) {
      setCategory(expense.category || "Other");
      setTruckId(expense.truck_id || "");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const amount = Number(form.get("amount")) || 0;

    if (amount <= 0) {
      setError("Enter a reimbursement amount greater than zero.");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("reimbursements")
      .insert({
        expense_id: expenseId || null,
        truck_id: truckId || null,
        category: category || null,
        reference:
          String(form.get("reference") || "").trim() || null,
        reimbursement_date: String(form.get("reimbursement_date")),
        amount,
        notes: String(form.get("notes") || "").trim() || null,
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    formElement.reset();
    setExpenseId("");
    setCategory("Other");
    setTruckId("");
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {open && (
        <form onSubmit={submit} className="fp-add-reimb-form fp-add-reimb-mobile-model">
          <div className="fp-reimb-form-intro md:col-span-2">
            <div>
              <span>NEW REIMBURSEMENT</span>
              <strong>Record money recovered back into the business.</strong>
            </div>
            <p>
              Link an existing expense when applicable, or leave it unlinked
              and create a standalone reimbursement.
            </p>
          </div>

          <label className="fp-add-reimb-field md:col-span-2">
            <span>Link Existing Expense · Optional</span>
            <select
              name="expense_id"
              value={expenseId}
              onChange={(event) => selectExpense(event.target.value)}
              className="fp-add-reimb-control"
            >
              <option value="">Standalone reimbursement / no expense link</option>
              {expenses.map((expense) => (
                <option key={expense.id} value={expense.id}>
                  {expense.expense_date} · {expense.category || "Expense"} ·{" "}
                  {expense.vendor || "No vendor"} · $
                  {Number(expense.amount || 0).toFixed(2)}
                </option>
              ))}
            </select>
            <small>
              {selectedExpense
                ? "Category and truck were filled from the selected expense. You can adjust them if needed."
                : "No expense selected — this reimbursement will be stored as a new standalone recovery."}
            </small>
          </label>

          <label className="fp-add-reimb-field">
            <span>Category *</span>
            <select
              name="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="fp-add-reimb-control"
              required
            >
              {CATEGORIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="fp-add-reimb-field">
            <span>Truck Assignment</span>
            <select
              name="truck_id"
              value={truckId}
              onChange={(event) => setTruckId(event.target.value)}
              className="fp-add-reimb-control"
            >
              <option value="">No truck / company level</option>
              {trucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  Truck #{truck.unit_number}
                </option>
              ))}
            </select>
          </label>

          <label className="fp-add-reimb-field">
            <span>Date *</span>
            <input
              name="reimbursement_date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="fp-add-reimb-control"
            />
          </label>

          <label className="fp-add-reimb-field">
            <span>Amount *</span>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="fp-add-reimb-control"
            />
          </label>

          <label className="fp-add-reimb-field md:col-span-2">
            <span>Reference / Statement</span>
            <input
              name="reference"
              placeholder="Check #, statement reference, settlement ID..."
              className="fp-add-reimb-control"
            />
          </label>

          <label className="fp-add-reimb-field md:col-span-2">
            <span>Notes</span>
            <textarea
              name="notes"
              rows={3}
              placeholder="Add context about who reimbursed you and what this recovery is for..."
              className="fp-add-reimb-control"
            />
          </label>

          {error && (
            <div className="fp-add-reimb-error md:col-span-2">
              {error}
            </div>
          )}

          <div className="fp-add-reimb-footer md:col-span-2">
            <div className="fp-add-reimb-footer-note">
              {expenseId
                ? "Linked reimbursement"
                : "Standalone reimbursement"}
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => setOpen(false)}
              className="fp-add-reimb-close"
            >
              Close
            </button>
            <button disabled={saving} className="fp-add-reimb-save">
              {saving ? "Saving..." : "Save Reimbursement"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
