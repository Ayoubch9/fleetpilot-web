"use client";
import { formatMoney } from "@/lib/format";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Reimbursement = {
  id: string;
  expense_id: string | null;
  truck_id: string | null;
  category: string | null;
  reference: string | null;
  reimbursement_date: string | null;
  amount: number | string | null;
  notes: string | null;
};

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

const REIMBURSEMENT_CATEGORIES = [
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

export default function ReimbursementActions({
  row,
  expenses,
  trucks,
}: {
  row: Reimbursement;
  expenses: Expense[];
  trucks: Truck[];
}) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!menuOpen) return;

    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = 168;
      setPosition({
        top: rect.bottom + 6,
        left: Math.min(
          window.innerWidth - width - 12,
          Math.max(12, rect.right - width)
        ),
      });
    }

    function outside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (
        document
          .querySelector("[data-reimb-actions-portal]")
          ?.contains(target)
      ) return;
      setMenuOpen(false);
    }

    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    document.addEventListener("mousedown", outside);

    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("mousedown", outside);
    };
  }, [menuOpen]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const data = new FormData(event.currentTarget);

    const { error } = await createClient()
      .from("reimbursements")
      .update({
        expense_id: String(data.get("expense_id") || "") || null,
        truck_id: String(data.get("truck_id") || "") || null,
        category: String(data.get("category") || "") || null,
        reference: String(data.get("reference") || "").trim() || null,
        reimbursement_date: String(
          data.get("reimbursement_date") || ""
        ),
        amount: Number(data.get("amount")) || 0,
        notes: String(data.get("notes") || "").trim() || null,
      })
      .eq("id", row.id);

    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    setEditOpen(false);
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    setError("");

    const { error } = await createClient()
      .from("reimbursements")
      .delete()
      .eq("id", row.id);

    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDeleteOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="fp-reimb-actions-trigger"
        onClick={() => {
          setError("");
          setMenuOpen((value) => !value);
        }}
        aria-label="Reimbursement actions"
      >
        •••
      </button>

      {menuOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-reimb-actions-portal
            className="fp-reimb-actions-menu-portal"
            style={{ top: position.top, left: position.left }}
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setEditOpen(true);
              }}
            >
              <EditIcon />
              <span>Edit Reimbursement</span>
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
            >
              <DeleteIcon />
              <span>Delete Reimbursement</span>
            </button>
          </div>,
          document.body
        )}

      {editOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-reimb-action-backdrop">
            <form className="fp-reimb-edit-modal" onSubmit={save}>
              <header>
                <div>
                  <span>REIMBURSEMENT DETAILS</span>
                  <h2>Edit Reimbursement</h2>
                  <p>Update the recovery record saved in MileVoxa.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  disabled={busy}
                >
                  ×
                </button>
              </header>

              <div className="fp-reimb-edit-grid">
                <label className="wide">
                  <span>Linked Expense · Optional</span>
                  <select
                    name="expense_id"
                    defaultValue={row.expense_id || ""}
                  >
                    <option value="">Standalone reimbursement</option>
                    {expenses.map((expense) => (
                      <option key={expense.id} value={expense.id}>
                        {expense.expense_date} · {expense.category || "Expense"} ·{" "}
                        {expense.vendor || "No vendor"} ·{" "}
                        {formatMoney(Number(expense.amount || 0))}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Category *</span>
                  <select
                    name="category"
                    defaultValue={row.category || "Other"}
                    required
                  >
                    {REIMBURSEMENT_CATEGORIES.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Truck Assignment</span>
                  <select
                    name="truck_id"
                    defaultValue={row.truck_id || ""}
                  >
                    <option value="">No truck / company level</option>
                    {trucks.map((truck) => (
                      <option key={truck.id} value={truck.id}>
                        Truck #{truck.unit_number}
                      </option>
                    ))}
                  </select>
                </label>

                <Field
                  name="reimbursement_date"
                  label="Date *"
                  type="date"
                  defaultValue={dateValue(row.reimbursement_date)}
                  required
                />
                <Field
                  name="amount"
                  label="Amount *"
                  type="number"
                  step="0.01"
                  defaultValue={row.amount ?? ""}
                  required
                />
                <label className="wide">
                  <span>Reference / Statement</span>
                  <input
                    name="reference"
                    defaultValue={row.reference || ""}
                    placeholder="Check #, statement reference, settlement ID..."
                  />
                </label>

                <label className="wide">
                  <span>Notes</span>
                  <textarea name="notes" defaultValue={row.notes || ""} />
                </label>
              </div>

              {error && (
                <div className="fp-reimb-action-error">{error}</div>
              )}

              <footer>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary"
                  disabled={busy}
                >
                  {busy ? "Saving..." : "Save Changes"}
                </button>
              </footer>
            </form>
          </div>,
          document.body
        )}

      {deleteOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-reimb-action-backdrop">
            <div className="fp-reimb-delete-modal">
              <div className="fp-reimb-delete-icon">
                <DeleteIcon />
              </div>
              <h2>Delete this reimbursement?</h2>
              <p>
                This permanently removes only the reimbursement record. The
                original expense remains unchanged.
              </p>

              {error && (
                <div className="fp-reimb-action-error">{error}</div>
              )}

              <div className="fp-reimb-delete-actions">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={remove}
                  disabled={busy}
                >
                  {busy ? "Deleting..." : "Delete Reimbursement"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  step,
  required = false,
}: {
  name: string;
  label: string;
  defaultValue: string | number;
  type?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        required={required}
      />
    </label>
  );
}

function dateValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="m4 20 4.2-1 10-10-3.2-3.2-10 10L4 20Z" />
      <path d="m13.8 7 3.2 3.2" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}
